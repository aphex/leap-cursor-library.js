# Leap Cursor Library

This library is used in addition to the official LeapJS Library (https://github.com/leapmotion/leapjs) and adds in core dom interactivity thought gestures and hover to tap. It uses DOM attributes to control functionality and varying levels of interactivity and responses to cursors in the system. This library also includes a mouse simulator to allow for developers without a leap device to simulate events. 

The Leap Cursor Library also has early basic suport for Sencha Touch applications. Allowing developers to quickly interactive with touch applications using the Leap. You can find out more in Sencha Touch here (http://www.sencha.com/products/touch). 

All the demos and code testing has currently been tested on Google Chrome. It is highly recommended you use Chrome to test our all the examples and experiment with the Leap Cursor Library.

### Quick Download

1. Download and include leapjs into your project from <https://github.com/leapmotion/leapjs>

2. Download a copy of leap-cursor-library.js from <https://github.com/aphex/leap-cursor-library.js>

3. Unzip and include leap-manager.min.js and leap-manager.min.css in your project

3. Enjoy!


### Full Dev & Examples

1. Install [Node.js](http://nodejs.org/)

2. Install [Grunt](http://gruntjs.com/getting-started#installing-the-cli)

4. Clone the leap-cursor-library.js repository  
```
$ git clone git@github.com:aphex/leap-cursor-library.js.git
```

5. Install dependencies  
```
$ npm install
```

6. Serve the examples and watch for changes to the core files
```
$ grunt serve
```

7. Open <http://localhost:8001> to view examples


### Usage

At the most basic level the Leap Manager can begin adding interacivity to your site or application with a single line. Simply include the files needed for leapJS then add the leap-manager.min.css. Finally include leap-manager.min.js to the bottom of your body tag. Then simply run

```javascript
    LeapManager.init({});
```


### Folder Structure
- **build/css** Developer and Deploy version of the core CSS for the cursor library
- **build/js** Minified leap-manager.js for use in production environments
- **examples/** Examples for syntax and UI concepts
- **lib/** Third party assets
- **src/** Leap Cursor Library source files
