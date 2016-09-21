package hu.thsoft.game

import hu.thsoft.firebase.Firebase
import upickle.Js
import scala.scalajs.js
import hu.thsoft.firebase.FirebaseDataSnapshot
import monix.execution.Scheduler.Implicits.global
import upickle.default.writeJs

abstract class Change[D <: Data] {

  def apply(firebase: Firebase)

}

abstract class AtomicChange[Value](value: Value) extends Change[AtomicData[Value]] {

  def writeJson: Value => Js.Value

  def apply(firebase: Firebase) {
    firebase.set(upickle.json.writeJs(writeJson(value)).asInstanceOf[js.Any])
  }

}

class StringChange(value: String) extends AtomicChange[String](value) {

  def writeJson = writeJs[String]

}

class NumberChange(value: Double) extends AtomicChange[Double](value) {

  def writeJson = writeJs[Double]

}

class BooleanChange(value: Boolean) extends AtomicChange[Boolean](value) {

  def writeJson = writeJs[Boolean]

}

abstract class ListChange[Element <: Data] extends Change[ListData[Element]]

// TODO class TransformListChange[Element <: Data](elementChange: Change[Element]) extends ListChange[Element] {

class PushToListChange[Element <: Data](elementChange: Change[Element]) extends ListChange[Element] {

  def apply(firebase: Firebase) {
    val newElementFirebase = firebase.push(null)
    elementChange.apply(newElementFirebase)
  }

}

class ReferenceChange[Referred <: Data](referredChange: Change[Referred]) extends Change[ReferenceData[Referred]] {

  def apply(firebase: Firebase) {
    FirebaseData.observeString(firebase).headF.foreach(storedUrl => {
      storedUrl.value.right.foreach(url => {
        referredChange.apply(new Firebase(url))
      })
    })
  }

}

class RecordChange[R <: Data](fieldChanges: Seq[FieldChange[_ <: Data]]) extends Change[R] {

  def apply(firebase: Firebase) {
    fieldChanges.foreach(fieldChange => {
      fieldChange.change.apply(fieldChange.field.firebase)
    })
  }

}

case class FieldChange[F <: Data](field: F, change: Change[F])

class ChoiceChange[C <: Data](selectedCase: Case[C], caseChange: Change[C]) extends Change[C] {

  def apply(firebase: Firebase) {
    new StringChange(selectedCase.name).apply(FirebaseData.caseNameChild(firebase))
  }

}