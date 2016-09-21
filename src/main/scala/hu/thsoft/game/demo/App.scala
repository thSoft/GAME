package hu.thsoft.game.demo

import hu.thsoft.firebase.Firebase
import scala.scalajs.js.JSApp
import org.scalajs.dom.document
import hu.thsoft.game.BooleanData
import hu.thsoft.game.BooleanRule
import hu.thsoft.game.ChoiceData
import hu.thsoft.game.ChoiceRule
import hu.thsoft.game.Element
import hu.thsoft.game.ListRule
import hu.thsoft.game.NumberData
import hu.thsoft.game.NumberRule
import hu.thsoft.game.RecordData
import hu.thsoft.game.StringData
import hu.thsoft.game.StringRule
import hu.thsoft.game.Case
import hu.thsoft.game.ReferenceRule
import hu.thsoft.game.RecordRule
import hu.thsoft.game.RuleCase
import hu.thsoft.game.ListData
import hu.thsoft.game.ReferenceData

object App extends JSApp {

  def main() {
    val container = document.createElement("div")
    document.body.appendChild(container)
    new MyRecordRule(new MyRecordData(new Firebase("https://thsoft.firebaseio.com/DUX-POC/test/record"))).run(container)
  }

}

class MyRecordData(firebase: Firebase) extends RecordData(firebase) {
  lazy val numberReference = newField("number", new ReferenceData(_, new NumberData(_)))
  lazy val list = newField("list", new ListData(_, new StringData(_)))
  lazy val choice = newField("choice", new MyChoiceData(_))
}

class MyChoiceData(firebase: Firebase) extends ChoiceData(firebase) {
  lazy val case1 = new Case("case1", new BooleanData(_))
  lazy val case2 = new Case("case2", new StringData(_))
}

class MyRecordRule(recordData: MyRecordData) extends RecordRule(recordData) {

  def getRules = {
    Seq(
      new Element("number reference: "),
      new ReferenceRule(recordData.numberReference, (numberData: NumberData) => new NumberRule(numberData)),
      new Element("; list: "),
      new MyListRule(recordData.list),
      new Element("; choice: "),
      new MyChoiceRule(recordData.choice)
    )
  }

}

class MyListRule(listData: ListData[StringData]) extends ListRule[StringData](listData) {

  def getElementRule(elementData: StringData) = {
    new StringRule(elementData)
  }

  def separator = {
    new Element(", ")
  }

}

class MyChoiceRule(choiceData: MyChoiceData) extends ChoiceRule[MyChoiceData](choiceData) {

  def getCases = {
    Seq(
      RuleCase(choiceData.case1, (booleanData: BooleanData) => new BooleanRule(booleanData)),
      RuleCase(choiceData.case2, (stringData: StringData) => new StringRule(stringData))
    )
  }

}
