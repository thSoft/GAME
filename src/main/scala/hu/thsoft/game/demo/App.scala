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
import hu.thsoft.game.cells._
import hu.thsoft.game.cells.Cell
import hu.thsoft.game.Data
import hu.thsoft.game.InvalidHandler
import hu.thsoft.game.Invalid
import hu.thsoft.game.Stored
import japgolly.scalajs.react.vdom.prefix_<^._
import hu.thsoft.game.ChildrenHandler
import hu.thsoft.game.StringChange
import japgolly.scalajs.react.Callback
import scalacss.Defaults._
import scalacss.ScalaCssReact._
import hu.thsoft.game.AtomicData
import hu.thsoft.game.AtomicChange
import hu.thsoft.game.NumberChange
import scala.util.Try
import hu.thsoft.game.BooleanChange

object App extends JSApp {

  def main() {
    val container = document.createElement("div")
    document.body.appendChild(container)
    new MyRecordRule(new MyRecordData(new Firebase("https://thsoft.firebaseio.com/DUX-POC/test/record"))).run(container, Render.apply, None)
    List(Styles).foreach(_.addToDocument())
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

class MyRecordRule(recordData: MyRecordData) extends RecordRule[MyRecordData, Cell[String]](recordData) with CellChildrenHandler {

  def getRules = {
    Seq(
      new CellElement("number reference: "),
      new ReferenceRule(recordData.numberReference, (numberData: NumberData) => new CellNumberRule(numberData)),
      new CellElement("; list: "),
      new MyListRule(recordData.list),
      new CellElement("; choice: "),
      new MyChoiceRule(recordData.choice)
    )
  }

}

class MyListRule(listData: ListData[StringData]) extends ListRule[StringData, Cell[String]](listData) with CellChildrenHandler {

  def getElementRule(elementData: StringData) = {
    new CellStringRule(elementData)
  }

  def separator = {
    new CellElement(", ")
  }

}

class MyChoiceRule(choiceData: MyChoiceData) extends ChoiceRule[MyChoiceData, Cell[String]](choiceData) with CellInvalidHandler {

  def getCases = {
    Seq(
      RuleCase(choiceData.case1, (booleanData: BooleanData) => new CellBooleanRule(booleanData)),
      RuleCase(choiceData.case2, (stringData: StringData) => new CellStringRule(stringData))
    )
  }

}
