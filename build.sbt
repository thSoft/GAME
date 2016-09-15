enablePlugins(ScalaJSPlugin)

name := "Sandbox"

scalaVersion := "2.11.8"

libraryDependencies ++= Seq(
  "com.github.japgolly.scalajs-react" %%% "core" % "0.10.4",
  "hu.thsoft" %%% "firebase-scalajs" % "2.4.1",
  "io.monix" %%% "monix" % "2.0.1",
  "com.lihaoyi" %%% "upickle" % "0.3.8",
  "org.scalaz" %%% "scalaz-core" % "7.2.2"
)

jsDependencies ++= Seq(
  "org.webjars.bower" % "react" % "0.14.3"
    /        "react-with-addons.js"
    minified "react-with-addons.min.js"
    commonJSName "React",
  "org.webjars.bower" % "react" % "0.14.3"
    /         "react-dom.js"
    minified  "react-dom.min.js"
    dependsOn "react-with-addons.js"
    commonJSName "ReactDOM"
)

EclipseKeys.withSource := true

persistLauncher in Compile := true

persistLauncher in Test := false