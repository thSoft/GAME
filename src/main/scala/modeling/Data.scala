package modeling

import hu.thsoft.firebase.Firebase

abstract class Data(val firebase: Firebase)

abstract class AtomicData[Value](firebase: Firebase) extends Data(firebase)

class NumberData(firebase: Firebase) extends AtomicData[Double](firebase)

class StringData(firebase: Firebase) extends AtomicData[String](firebase)

class BooleanData(firebase: Firebase) extends AtomicData[Boolean](firebase)

class ListData[Element <: Data](firebase: Firebase, val getElementData: Firebase => Element) extends Data(firebase) {

  //def filter(predicate: Element => Boolean): ListData[Element]

}

class ReferenceData[Referred <: Data](firebase: Firebase, val getReferredData: Firebase => Referred) extends Data(firebase)

class RecordData(firebase: Firebase) extends Data(firebase) {
  def newField[Field <: Data](name: String, makeData: Firebase => Field): Field = {
    makeData(firebase.child(name))
  }
}

class ChoiceData(firebase: Firebase) extends Data(firebase)

class Case[D <: Data](val name: String, val makeData: Firebase => D)