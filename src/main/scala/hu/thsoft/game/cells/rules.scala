package hu.thsoft.game.cells

import hu.thsoft.game.Stored
import hu.thsoft.game.BooleanData
import hu.thsoft.game.NumberRule
import hu.thsoft.game.StringChange
import hu.thsoft.game.BooleanChange
import hu.thsoft.game.StringData
import hu.thsoft.game.InvalidHandler
import hu.thsoft.game.NumberData
import hu.thsoft.game.AtomicChange
import hu.thsoft.game.AtomicData
import hu.thsoft.game.BooleanRule
import hu.thsoft.game.StringRule
import hu.thsoft.game.ChildrenHandler
import hu.thsoft.firebase.Firebase
import hu.thsoft.game.NumberChange
import hu.thsoft.firebase.Firebase
import hu.thsoft.game.Element
import scala.util.Try
import hu.thsoft.game.Data
import japgolly.scalajs.react.Callback
import hu.thsoft.game.Invalid
import japgolly.scalajs.react.vdom.prefix_<^._

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

trait CellInvalidHandler extends InvalidHandler[Cell[String]] {

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

trait CellChildrenHandler extends ChildrenHandler[Cell[String]] {

  def combine(data: Data, children: Seq[Cell[String]]): Cell[String] = {
    DataCell(data.firebase, compositeContent(children))
  }

}

class CellElement(text: String) extends Element[Cell[String]](text) {

  def view = Cell("", atomicContent(text))

}

class CellNumberRule(numberData: NumberData) extends NumberRule[Cell[String]](numberData) with CellInvalidHandler {

  def view(double: Double) = {
    DataCell.atomic(numberData, double.toString(), input => new NumberChange(input.toDouble))
  }

}

class CellStringRule(stringData: StringData) extends StringRule[Cell[String]](stringData) with CellInvalidHandler {

  def view(string: String) = {
    DataCell.atomic(stringData, string, input => new StringChange(input))
  }

}

class CellBooleanRule(booleanData: BooleanData) extends BooleanRule[Cell[String]](booleanData) with CellInvalidHandler {

  def view(boolean: Boolean) = {
    DataCell.atomic(booleanData, boolean.toString(), input => new BooleanChange(input.toBoolean))
  }

}