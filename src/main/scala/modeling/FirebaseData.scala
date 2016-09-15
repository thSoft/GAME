package modeling

import scala.scalajs.js
import hu.thsoft.firebase.Firebase
import upickle.Js
import upickle.default.readJs
import monix.reactive.Observable
import monix.reactive.subjects.PublishSubject
import hu.thsoft.firebase.FirebaseDataSnapshot
import monix.reactive.observables.ConnectableObservable
import monix.execution.cancelables.BooleanCancelable
import monix.reactive.observers.Subscriber
import scala.collection.mutable.ListBuffer

case class Stored[+T](
  firebase: Firebase,
  value: Either[Invalid, T]
)

case class Invalid(json: Js.Value, expectedTypeName: String, error: Throwable)

case class Cancellation(cancellation: js.Any) extends Throwable

object FirebaseData {

  def observeRaw(firebase: Firebase, eventType: String = "value"): Observable[FirebaseDataSnapshot] =
    new ConnectableObservable[FirebaseDataSnapshot] {

      private val channel = PublishSubject[FirebaseDataSnapshot]

      private lazy val subscription = {
        val callback =
          (snapshot: FirebaseDataSnapshot, previousKey: js.UndefOr[String]) => {
            channel.onNext(snapshot)
            ()
          }
        val cancelCallback =
          (cancellation: js.Any) => {
            channel.onError(Cancellation(cancellation))
          }
        try {
          firebase.on(eventType, callback, cancelCallback)
        } catch {
          case e: Throwable => channel.onError(e)
        }
        BooleanCancelable(() => {
          channel.onComplete()
          firebase.off(eventType, callback)
        })
      }

      override def connect() = subscription

      override def unsafeSubscribeFn(subscriber: Subscriber[FirebaseDataSnapshot]) = {
        channel.unsafeSubscribeFn(subscriber)
      }

    }.refCount

  def observeAtomic[T](readJson: Js.Value => T)(typeName: String)(firebase: Firebase): Observable[Stored[T]] =
    observeRaw(firebase).map(snapshot => {
      val snapshotValue = snapshot.`val`
      val json = upickle.json.readJs(snapshotValue)
      val value =
        json match {
          case Js.Null => Left(Invalid(null, typeName, new NullPointerException))
          case _ =>
            try {
              Right(readJson(json))
            } catch {
              case e: Throwable => Left(Invalid(json, typeName, e))
            }
        }
      Stored(firebase, value)
    })

  def observeString(firebase: Firebase): Observable[Stored[String]] =
    observeAtomic(readJs[String])("string")(firebase)

  def observeInt(firebase: Firebase): Observable[Stored[Int]] =
    observeAtomic(readJs[Int])("integer")(firebase)

  def observeDouble(firebase: Firebase): Observable[Stored[Double]] =
    observeAtomic(readJs[Double])("double")(firebase)

  def observeBoolean(firebase: Firebase): Observable[Stored[Boolean]] =
    observeAtomic(readJs[Boolean])("boolean")(firebase)

  def getChildren(snapshot: FirebaseDataSnapshot): List[Firebase] = {
    val children = ListBuffer[Firebase]()
    snapshot.forEach((child: FirebaseDataSnapshot) => {
      children += child.ref()
      false
    })
    children.toList
  }

}