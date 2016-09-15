package modeling

import org.scalajs.dom.raw.Node

import hu.thsoft.firebase.Firebase
import japgolly.scalajs.react.ReactDOM
import japgolly.scalajs.react.ReactElement
import japgolly.scalajs.react.vdom.prefix_<^._
import monix.execution.Scheduler.Implicits.global
import monix.reactive.Observable
import scalaz.std.list._
import upickle.Js

abstract class Rule {

  def observe: Observable[ReactElement]

  def run(container: Node) = {
    observe.foreach(element => ReactDOM.render(element, container))
  }

  def viewInvalid(stored: Stored[_], invalid: Invalid): ReactElement = {
    <.a(
      "⚠",
      ^.href := stored.firebase.toString(),
      ^.target := "_blank",
      ^.title := s"Expected ${invalid.expectedTypeName} but got ${invalid.json}"
    )
  }
}

class Element(text: String) extends Rule {

  def observe = {
    Observable.pure(<.span(text))
  }

}

abstract class AtomicRule[D <: AtomicData[V], V](data: D) extends Rule {

  def observeValue: Firebase => Observable[Stored[V]]

  def observe = {
    observeValue(data.firebase).map(stored => {
      stored.value.fold(
        invalid => {
          viewInvalid(stored, invalid)
        },
        value => {
          <.span(value.toString())
        }
      )
    })
  }

}

class NumberRule(numberData: NumberData) extends AtomicRule[NumberData, Double](numberData) {

  def observeValue = FirebaseData.observeDouble

}

class StringRule(stringData: StringData) extends AtomicRule[StringData, String](stringData) {

  def observeValue = FirebaseData.observeString

}

class BooleanRule(booleanData: BooleanData) extends AtomicRule[BooleanData, Boolean](booleanData) {

  def observeValue = FirebaseData.observeBoolean

}

class ReferenceRule[R <: Data](referenceData: ReferenceData[R], getRule: R => Rule) extends Rule {

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

abstract class ListRule[E <: Data](listData: ListData[E]) extends Rule {

  def getElementRule(elementData: E): Rule

  def separator: Rule

  def observe = {
    val listObservable = FirebaseData.observeRaw(listData.firebase)
    listObservable.switchMap(snapshot => {
      val childFirebases = FirebaseData.getChildren(snapshot)
      val children = intersperse(childFirebases.map(childFirebase => {
        getElementRule(listData.getElementData(childFirebase)).observe
      }), separator.observe)
      Observable.combineLatestList(children:_*).map(<.span(_))
    })
  }

}

abstract class RecordRule[D <: RecordData](recordData: D) extends Rule {

  def getRules: Seq[Rule]

  def observe = {
    val children = getRules.map(_.observe)
    Observable.combineLatestList(children:_*).map(<.span(_))
  }

}

abstract class ChoiceRule[D <: ChoiceData](choiceData: D) extends Rule {

  def getCases: Seq[RuleCase[_]]

  def observe = {
    val typeNameObservable = FirebaseData.observeString(choiceData.firebase.child("type"))
    typeNameObservable.switchMap(storedTypeName => {
      storedTypeName.value.fold(
        invalid => {
          Observable.pure(viewInvalid(storedTypeName, invalid))
        },
        typeName => {
          getCases.find(_.dataCase.name == typeName).fold({
            val invalid = Invalid(Js.Str(typeName), getCases.map(_.dataCase.name).mkString(" or "), new Exception(s"unknown $typeName"))
            Observable.pure(viewInvalid(storedTypeName, invalid))
          })(ruleCase => {
            ruleCase.toRule(choiceData).observe
          })
        }
      )
    })
  }

}

class RuleCase[D <: Data](val dataCase: Case[D], val makeRule: D => Rule) {
  def toRule(choiceData: Data): Rule = {
    makeRule(dataCase.makeData(choiceData.firebase.child("value")))
  }
}