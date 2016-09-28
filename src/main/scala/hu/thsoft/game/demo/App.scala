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

object DataCell {

  def apply(firebase: Firebase, content: CellContent[String]): Cell[String] = {
    Cell(firebase.toString(), content)
  }

  def atomic[V](atomicData: AtomicData[V], text: String, getChange: String => AtomicChange[V]): Cell[String] = {
    val getCommands = (input: String) =>
      Try { getChange(input) }.toOption.toList.map(change =>
        Command[String](
          text = input,
          description = s"Change to $input",
          callback = navigator => Callback {
            atomicData.apply(change)
            navigator.navigateRight
          }
        )
      )
    DataCell(atomicData.firebase, atomicContent[String](text).copy(menu = Some(MenuContent(getCommands))))
  }

}

trait MyInvalidHandler extends InvalidHandler[Cell[String]] {

  def viewInvalid(stored: Stored[_], invalid: Invalid): Cell[String] = {
    DataCell(
      stored.firebase,
      atomicContent(
        <.a(
          "⚠",
          ^.href := stored.firebase.toString(),
          ^.target := "_blank",
          ^.title := s"Expected ${invalid.expectedTypeName} but got ${invalid.json}"
        ),
        ""
      )
    )
  }

}

trait MyChildrenHandler extends ChildrenHandler[Cell[String]] {

  def combine(data: Data, children: Seq[Cell[String]]): Cell[String] = {
    DataCell(data.firebase, compositeContent(children))
  }

}

class MyElement(text: String) extends Element[Cell[String]](text) {

  def view = Cell("", atomicContent(text))

}

class MyNumberRule(numberData: NumberData) extends NumberRule[Cell[String]](numberData) with MyInvalidHandler {

  def view(double: Double) = {
    DataCell.atomic(numberData, double.toString(), input => new NumberChange(input.toDouble))
  }

}

class MyStringRule(stringData: StringData) extends StringRule[Cell[String]](stringData) with MyInvalidHandler {

  def view(string: String) = {
    DataCell.atomic(stringData, string, input => new StringChange(input))
  }

}

class MyBooleanRule(booleanData: BooleanData) extends BooleanRule[Cell[String]](booleanData) with MyInvalidHandler {

  def view(boolean: Boolean) = {
    DataCell.atomic(booleanData, boolean.toString(), input => new BooleanChange(input.toBoolean))
  }

}

class MyRecordRule(recordData: MyRecordData) extends RecordRule[MyRecordData, Cell[String]](recordData) with MyChildrenHandler {

  def getRules = {
    Seq(
      new MyElement("number reference: "),
      new ReferenceRule(recordData.numberReference, (numberData: NumberData) => new MyNumberRule(numberData)),
      new MyElement("; list: "),
      new MyListRule(recordData.list),
      new MyElement("; choice: "),
      new MyChoiceRule(recordData.choice)
    )
  }

}

class MyListRule(listData: ListData[StringData]) extends ListRule[StringData, Cell[String]](listData) with MyChildrenHandler {

  def getElementRule(elementData: StringData) = {
    new MyStringRule(elementData)
  }

  def separator = {
    new MyElement(", ")
  }

}

class MyChoiceRule(choiceData: MyChoiceData) extends ChoiceRule[MyChoiceData, Cell[String]](choiceData) with MyInvalidHandler {

  def getCases = {
    Seq(
      RuleCase(choiceData.case1, (booleanData: BooleanData) => new MyBooleanRule(booleanData)),
      RuleCase(choiceData.case2, (stringData: StringData) => new MyStringRule(stringData))
    )
  }

}
