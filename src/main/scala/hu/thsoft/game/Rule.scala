package hu.thsoft.game

import org.scalajs.dom.raw.Node

import hu.thsoft.firebase.Firebase
import japgolly.scalajs.react.ReactDOM
import japgolly.scalajs.react.ReactElement
import japgolly.scalajs.react.vdom.prefix_<^._
import monix.execution.Scheduler.Implicits.global
import monix.reactive.Observable
import scalaz.std.list._
import upickle.Js
import japgolly.scalajs.react.Callback
import monix.reactive.subjects.BehaviorSubject
import monix.reactive.Observer

trait Rule[ViewModel] {

  def observe: Observable[ViewModel]

  def run[State](container: Node, render: (ViewModel, State, Observer[State]) => ReactElement, initialState: => State) = {
    val state = BehaviorSubject[State](initialState)
    val view = observe.combineLatestMap(state)((currentViewModel, currentState) =>
      render(currentViewModel, currentState, state)
    )
    view.foreach(element => ReactDOM.render(element, container))
  }

}

trait InvalidHandler[ViewModel] {

    def viewInvalid(stored: Stored[_], invalid: Invalid): ViewModel

}

abstract class Element[ViewModel](text: String) extends Rule[ViewModel] {

  def view: ViewModel

  def observe = {
    Observable.pure(view)
  }

}

abstract class AtomicRule[D <: AtomicData[V], V, ViewModel](data: D) extends Rule[ViewModel] with InvalidHandler[ViewModel] {

  def observeValue: Firebase => Observable[Stored[V]]

  def view(value: V): ViewModel

  def observe = {
    observeValue(data.firebase).map(stored => {
      stored.value.fold(
        invalid => {
          viewInvalid(stored, invalid)
        },
        value => {
          view(value)
        }
      )
    })
  }

}

abstract class NumberRule[ViewModel](numberData: NumberData) extends AtomicRule[NumberData, Double, ViewModel](numberData) {

  def observeValue = FirebaseData.observeDouble

}

abstract class StringRule[ViewModel](stringData: StringData) extends AtomicRule[StringData, String, ViewModel](stringData) {

  def observeValue = FirebaseData.observeString

}

abstract class BooleanRule[ViewModel](booleanData: BooleanData) extends AtomicRule[BooleanData, Boolean, ViewModel](booleanData) {

  def observeValue = FirebaseData.observeBoolean

}

class ReferenceRule[R <: Data, ViewModel](referenceData: ReferenceData[R], getRule: R => Rule[ViewModel]) extends Rule[ViewModel] {

  def observe = {
    val urlObservable = FirebaseData.observeString(referenceData.firebase)
    urlObservable.switchMap(storedUrl => {
      storedUrl.value.fold(
        invalid => {
          Observable.empty
        },
        url => {
          getRule(referenceData.getReferredData(new Firebase(url))).observe
        }
      )
    })
  }

}

trait ChildrenHandler[ViewModel] {

  def combine(data: Data, children: Seq[ViewModel]): ViewModel

}

abstract class ListRule[E <: Data, ViewModel](listData: ListData[E]) extends Rule[ViewModel] with ChildrenHandler[ViewModel] {

  def getElementRule(elementData: E): Rule[ViewModel]

  def separator: Rule[ViewModel]

  def observe = {
    val listObservable = FirebaseData.observeRaw(listData.firebase)
    listObservable.switchMap(snapshot => {
      val childFirebases = FirebaseData.getChildren(snapshot)
      val children = intersperse(childFirebases.map(childFirebase => {
        getElementRule(listData.getElementData(childFirebase)).observe
      }), separator.observe)
      Observable.combineLatestList(children:_*).map(combine(listData, _))
    })
  }

}

abstract class RecordRule[D <: RecordData, ViewModel](recordData: D) extends Rule[ViewModel] with ChildrenHandler[ViewModel] {

  def getRules: Seq[Rule[ViewModel]]

  def observe = {
    val children = getRules.map(_.observe)
    Observable.combineLatestList(children:_*).map(combine(recordData, _))
  }

}

abstract class ChoiceRule[D <: ChoiceData, ViewModel](choiceData: D) extends Rule[ViewModel] with InvalidHandler[ViewModel] {

  def getCases: Seq[RuleCase[_, ViewModel]]

  def observe = {
    val caseNameObservable = FirebaseData.observeString(FirebaseData.caseNameChild(choiceData.firebase))
    caseNameObservable.switchMap(storedCaseName => {
      storedCaseName.value.fold(
        invalid => {
          Observable.pure(viewInvalid(storedCaseName, invalid))
        },
        typeName => {
          getCases.find(_.dataCase.name == typeName).fold({
            val invalid = Invalid(Js.Str(typeName), getCases.map(_.dataCase.name).mkString(" or "), new Exception(s"unknown $typeName"))
            Observable.pure(viewInvalid(storedCaseName, invalid))
          })(ruleCase => {
            ruleCase.toRule(choiceData).observe
          })
        }
      )
    })
  }

}

case class RuleCase[D <: Data, ViewModel](dataCase: Case[D], makeRule: D => Rule[ViewModel]) {
  def toRule(choiceData: Data): Rule[ViewModel] = {
    makeRule(dataCase.makeData(FirebaseData.valueChild(choiceData.firebase)))
  }
}

abstract class ConditionalRule[ViewModel](conditionData: BooleanData, trueRule: Rule[ViewModel], falseRule: Rule[ViewModel]) extends Rule[ViewModel] with InvalidHandler[ViewModel] {

  def observe = {
    val conditionObservable = FirebaseData.observeBoolean(conditionData.firebase)
    conditionObservable.switchMap(storedCondition => {
      storedCondition.value.fold(
        invalid => {
          Observable.pure(viewInvalid(storedCondition, invalid))
        },
        condition => {
          val rule = if (condition) trueRule else falseRule
          rule.observe
        }
      )
    })
  }

}