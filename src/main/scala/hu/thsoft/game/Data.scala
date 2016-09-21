package hu.thsoft.game

import hu.thsoft.firebase.Firebase

abstract class Data(val firebase: Firebase) {

  type ChangeType <: Change[_]

  def apply(change: ChangeType) = {
    change.apply(firebase)
  }

}

abstract class AtomicData[Value](firebase: Firebase) extends Data(firebase) {

  type ChangeType = AtomicChange[Value]

}

class NumberData(firebase: Firebase) extends AtomicData[Double](firebase)

class StringData(firebase: Firebase) extends AtomicData[String](firebase)

class BooleanData(firebase: Firebase) extends AtomicData[Boolean](firebase)

class ListData[Element <: Data](firebase: Firebase, val getElementData: Firebase => Element) extends Data(firebase) {

  type ChangeType = ListChange[Element]

  // TODO def filter(predicate: Element => Boolean): ListData[Element]

}

class ReferenceData[Referred <: Data](firebase: Firebase, val getReferredData: Firebase => Referred) extends Data(firebase) {

  type ChangeType = ReferenceChange[Referred]

}

class RecordData(firebase: Firebase) extends Data(firebase) {

  type ChangeType = RecordChange[RecordData] // XXX

  def newField[Field <: Data](name: String, makeData: Firebase => Field): Field = {
    makeData(firebase.child(name))
  }

}

class ChoiceData(firebase: Firebase) extends Data(firebase) {

  type ChangeType = ChoiceChange[ChoiceData] // XXX

}

case class Case[D <: Data](name: String, makeData: Firebase => D)