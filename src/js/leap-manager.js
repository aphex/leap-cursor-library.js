/*global Leap*/
var LeapElement = function(element) {
    return {
        element: element,
        cursor: null,
        isLeapElement: true,
        isAttractor: function() {
            return this.element.getAttribute("leap-attractor") === "true" || (this.element.getAttribute("leap-attractor-x-padding") != null && !isNaN(this.element.getAttribute("leap-attractor-x-padding"))) || (this.element.getAttribute("leap-attractor-y-padding") != null && !isNaN(this.element.getAttribute("leap-attractor-y-padding")));
        },
        appendChild: function(element) {
            if (element instanceof HTMLElement) {
                return this.element.appendChild(element);
            } else {
                return this.element.appendChild(element.getElement());
            }
        },
        removeChild: function(element) {
            if (element instanceof HTMLElement) {
                return this.element.removeChild(element);
            } else {
                return this.element.removeChild(element.getElement());
            }
        },
        setStyle: function(style) {
            for (var key in style) {
                this.element.style[key] = style[key];
            }
        },
        getWidth: function() {
            return this.element.offsetWidth;
        },
        getHeight: function() {
            return this.element.offsetHeight;
        },
        getElement: function() {
            return element;
        },
        hasCursor: function() {
            return this.cursor !== null;
        },
        capture: function(cursor) {
            // console.log("Cursor Captured");
            this.cursor = cursor;
            this.cursor.capture(this);
        },
        release: function() {
            // console.log("Cursor Released");
            if (this.cursor) {
                this.cursor.release();
                this.cursor = null;
            }
        },
        getAttractorPadding: function() {
            return {
                x: parseInt(this.element.getAttribute("leap-attractor-x-padding"), 10) || 0,
                y: parseInt(this.element.getAttribute("leap-attractor-y-padding"), 10) || 0
            };
        },
        getClickDelay: function() {
            return this.element.getAttribute("leap-click-delay");
        },
        hasMultitap: function() {
            return this.element.getAttribute("leap-enable-multitap") === "true";
        },
        isTappable: function() {
            return this.element.getAttribute("leap-disable-tap") !== "true";
        },
        isHoverable: function() {
            return this.element.getAttribute("leap-disable-hover") !== "true";
        },
        setXY: function(x, y) {
            this.setX(x);
            this.setY(y);
        },
        setX: function(x) {
            this.element.style.left = x + "px";
        },
        setY: function(y) {
            this.element.style.top = y + "px";
        },
        getX: function() {
            return element.getBoundingClientRect().left;
        },
        getY: function() {
            return element.getBoundingClientRect().top;
        },
        addClass: function(classname) {
            var cn = this.element.className;
            //test for existance
            if (cn && cn.indexOf(classname) !== -1) {
                return;
            }
            //add a space if the element already has class
            if (cn !== '') {
                classname = ' ' + classname;
            }
            this.element.className = cn + classname;
        },
        removeClass: function(classname) {
            var cn = this.element.className;
            var rxp = new RegExp("\\s?\\b" + classname + "\\b", "g");
            cn = cn.replace(rxp, '');
            this.element.className = cn;
        },
        fireEvent: function(event) {
            this.element.dispatchEvent(event);
        }
    };
};

var LeapManagerUtils = (function() {
    var elementsCache = {};
    var ELEMENT_ID_PREFIX = "leap_element_";
    var elementCount = 0;

    return {
        getLeapElement: function(domElement) {
            if (!domElement.id) domElement.id = ELEMENT_ID_PREFIX + elementCount++;
            if (!elementsCache[domElement.id]) {
                elementsCache[domElement.id] = new LeapElement(domElement);
            }
            return elementsCache[domElement.id];
        },
        isElementVisible: function(element) {
            while (element !== document.body.parentNode) {
                if ('0' === LeapManagerUtils.getStyle(element, "opacity") || 'none' === LeapManagerUtils.getStyle(element, "display") || 'hidden' === LeapManagerUtils.getStyle(element, "visibility")) {
                    return false;
                }
                element = element.parentNode;
            }
            return true;
        },
        getStyle: function(el, style) {
            if (window.getComputedStyle) {
                return document.defaultView.getComputedStyle(el)[style];
            }
            if (el.currentStyle) {
                return el.currentStyle[style];
            }
        },
        extend: function(a, b) {
            for (var i in b) {
                a[i] = b[i];
            }
        },
        extendIf: function(a, b) {
            for (var i in b) {
                if (b[i] instanceof Object && b[i].constructor === Object) {
                    if (a[i] === undefined || a[i] === null) a[i] = {};
                    LeapManagerUtils.extendIf(a[i], b[i]);
                } else {
                    if (a[i] === undefined || a[i] === null) a[i] = b[i];
                }
            }
        },
        bind: function(func, scope, args) {
            return function() {
                if (!args) args = [];
                args = Array.prototype.slice.call(arguments).concat(args);
                func.apply(scope, args);
            };
        },
        map: function(value, srcLow, srcHigh, resultLow, resultHigh) {
            return (value === srcLow) ? resultLow : (value - srcLow) * (resultHigh - resultLow) / (srcHigh - srcLow) + resultLow;
        },
        error: function(error) {
            console.log(error);
        }
    };
})();

var Cursor = function(config) {
    var TIMER_CURSOR_CLASS = "leap-timer-cursor";
    var cursor = {
        //Position
        x: 0,
        y: 0,
        z: 0,
        //Speed
        X: 0,
        Y: 0,
        Z: 0,
        //Velocity
        vX: 0,
        vY: 0,
        vZ: 0,
        enabled: true,
        captureHost: null,
        attractor: null,
        element: null,
        isTimerRunning: false,
        startTime: null,
        animiationIntervalID: null,
        currentClickDelay: 0,
        defaultConfig: {
            multitapEnabled: false,
            clickDelay: 0,
            easing: 0.3
        },
        onAdded: function() {},
        onRemoved: function() {},
        constructor: function(config) {
            if (!config.source) {
                LeapManagerUtils.error('Cursor#constructor: You must specify a `source`.');
                return null;
            }
            if (!config.id) {
                LeapManagerUtils.error('Cursor#constructor: You must specify a `id`.');
                return null;
            }
            if (!config.icon) {
                LeapManagerUtils.error('Cursor#constructor: You must specify a `icon`.');
                return null;
            }
            LeapManagerUtils.extendIf(config, this.defaultConfig);
            this.source = config.source;
            this.id = config.id;
            this.icon = config.icon;
            this.easing = config.easing;
            this.clickDelay = config.clickDelay;
            this.multitapEnabled = config.multitapEnabled;
            if (this.clickDelay === 0 || isNaN(this.clickDelay)) this.clickDelay = null;
            this.onTapUpdate = LeapManagerUtils.bind(this._onTapUpdate, this);
            if (this.clickDelay) this.icon.addClass(TIMER_CURSOR_CLASS);
            if (this.icon instanceof HTMLElement) this.icon = new LeapElement(this.icon);
            if (config.position) {
                this.update(config.position.x, config.position.y);
                var halfWidth = (this.icon.getWidth() / 2);
                var halfHeight = (this.icon.getHeight() / 2);
                this.icon.setX((config.position.x * window.innerWidth) + halfWidth);
                this.icon.setY((config.position.y * window.innerHeight) + halfHeight);
            }
        },
        //Enabled
        setEnabled: function(value) {
            this.enabled = value;
        },
        isEnabled: function() {
            return this.enabled;
        },
        //Element
        setElement: function(element) {
            this.element = element;
        },
        hasElement: function() {
            return this.element !== null;
        },
        //Callbacks from Manager for Element Interactions
        onElementOver: function(element) {
            this.setElement(element);
            this.currentClickDelay = this.element.getClickDelay() || this.clickDelay;
            if (element.isHoverable()) {
                element.addClass("hover");
            }
            if (this.currentClickDelay && element.isTappable()) {
                this.startTimer();
            }
        },
        onElementMove: function(element) {},
        onElementOut: function(element) {
            if (element.isHoverable()) {
                element.removeClass("hover");
            }
            if (this.currentClickDelay && element.isTappable()) {
                this.stopTimer();
            }
            this.setElement(null);
        },
        //Attractor
        setAttractor: function(attractor) {
            this.attractor = attractor;
        },
        hasAttractor: function() {
            return this.attractor !== null;
        },
        //Capture  & Release
        capture: function(host) {
            this.captureHost = host;
            this.setAttractor(null);
        },
        isCaptured: function() {
            return this.captureHost != null;
        },
        release: function() {
            this.captureHost = null;
        },
        //Position
        update: function(x, y, z) {
            this.setPositionX(x);
            this.setPositionY(y);
            this.setPositionZ(z);
        },
        setPositionX: function(value) {
            this.X = value - this.x;
            this.x = value;
        },
        setPositionY: function(value) {
            this.Y = value - this.y;
            this.y = value;
        },
        setPositionZ: function(value) {
            this.Z = value - this.z;
            this.z = value;
        },
        //Speed
        getX: function() {
            return this.x;
        },
        getY: function() {
            return this.y;
        },
        getZ: function() {
            return this.z;
        },
        //Velocity
        setVelocityXYZ: function(x, y, z) {
            this.setVelocityX(x);
            this.setVelocityY(y);
            this.setVelocityZ(z);
        },
        setVelocityX: function(value) {
            this.vX = value;
        },
        setVelocityY: function(value) {
            this.vY = value;
        },
        setVelocityZ: function(value) {
            this.vZ = value;
        },
        getVelocityX: function() {
            return this.vX;
        },
        getVelocityY: function() {
            return this.vY;
        },
        getVelocityZ: function() {
            return this.vZ;
        },
        //Easing
        getEasing: function() {
            return this.easing;
        },
        fireEvent: function(event) {
            if (this.element) {
                this.element.fireEvent.apply(this.element, [event]);
            }
        },
        startTimer: function() {
            // console.log("startTimer");
            if (this.animiationIntervalID) this.stopTimer();
            this.startTime = new Date();
            var me = this;
            this.animiationIntervalID = setInterval(
                function() {
                    me.onTapUpdate();
                }, 1000 / 30
            );
            this.onTimerStart();
        },
        stopTimer: function() {
            clearInterval(this.animiationIntervalID);
            this.startTime = null;
            this.onTimerStop();
        },
        _onTapUpdate: function() {
            // console.log("_onTapUpdate"); 
            if (!this.startTime) {
                this.stopTimer();
                return;
            }
            var now = new Date();
            var time = now - this.startTime;
            this.onTimerUpdate(time);
            if (time >= this.currentClickDelay) {
                this.stopTimer();
                this.onTimerComplete();
            }
        },
        onTimerStart: function() {
            // console.log("onTimerStart");
            this.icon.setStyle({
                "transitionDuration": this.currentClickDelay / 1000 + "s"
            });
            this.icon.addClass("active-timer");
        },
        onTimerStop: function() {
            // console.log("onTimerStop");
            this.icon.setStyle({
                "transitionDuration": "0s"
            });
            this.icon.removeClass("active-timer");
        },
        onTimerUpdate: function(time) {},
        onTimerComplete: function() {
            if (this.element) {
                var mouseEvent = document.createEvent("MouseEvent");
                mouseEvent.initMouseEvent("mousedown", true, false, window, 1, 0, 0, 0, 0, false, false, false, false, 0, this.element);
                this.element.fireEvent(mouseEvent);
                mouseEvent = document.createEvent("MouseEvent");
                mouseEvent.initMouseEvent("mouseup", true, false, window, 1, 0, 0, 0, 0, false, false, false, false, 0, this.element);
                this.element.fireEvent(mouseEvent);
                mouseEvent = document.createEvent("MouseEvent");
                mouseEvent.initMouseEvent("click", true, false, window, 1, 0, 0, 0, 0, false, false, false, false, 0, this.element);
                this.element.fireEvent(mouseEvent);
                var tapEvent = document.createEvent("UIEvent");
                tapEvent.initUIEvent("tap", true, false, window, 1, 0, 0, 0, 0, false, false, false, false, 0, this.element);
                this.element.fireEvent(tapEvent);
                
                if (this.multitapEnabled || this.element.hasMultitap()) {
                    var me = this;
                    setTimeout(function() {
                        me.startTimer();
                    }, 100);
                } else {
                    this.release();
                }
            } else {
                this.release();
            }
        }
    };
    cursor.constructor(config);
    return cursor;
};

var CursorManager = function(config) {
    var INTERACTIVE_SELECTOR = '.leap-interactive';
    var CURSOR_CONTAINER_CLASS = 'leap-cursor-container';
    var LEAP_CURSOR_CLASS = 'leap-cursor';
    var cursors = [];
    var cursorContainer = null;
    var elementLookup = {};
    var mouseEvent = null;
    var interactiveSelector = "";
    var cursorManager = {
        init: function(config) {
            if (config.interactiveSelector) this.interactiveSelector = config.interactiveSelector;
            if (!cursorContainer) {
                cursorContainer = new LeapElement(document.createElement('div'));
                var root = config.root || document.body;
                root.appendChild(cursorContainer.element);
                cursorContainer.addClass(CURSOR_CONTAINER_CLASS);
                cursorContainer.setStyle({
                    zIndex: 100000,
                    position: "absolute",
                    top: "0px",
                    left: "0px"
                });
            }
        },
        add: function(cursor) {
            if (cursors.indexOf(cursor) === -1) {
                cursors.push(cursor);
                cursorContainer.appendChild(cursor.icon);
                cursor.icon.addClass(LEAP_CURSOR_CLASS);
                cursor.onAdded();
            }
        },
        remove: function(cursor) {
            if(elementLookup[cursor.source] !== null && elementLookup[cursor.source][cursor.id] !== null) {
                var element = elementLookup[cursor.source][cursor.id];
                 if (element.isAttractor()) {
                    cursor.setAttractor(null);
                    //Release Cursor
                    if (element.hasCursor()) element.release();
                }
                this.cursorOut(cursor, element, {x:0,y:0});
                elementLookup[cursor.source][cursor.id] = null;
            }
            var cursorIndex = cursors.indexOf(cursor);
            if (cursorIndex === -1) return;
            cursorContainer.removeChild(cursor.icon);
            cursors.splice(cursorIndex, 1);
            cursor.onRemoved();
        },
        update: function() {
            var windowPoint, destinationPoint, xDiff, yDiff, xRatio, yRatio, halfWidth, halfHeight, minPull = 0.1,
                maxPull = 1,
                bounds, originalElement, element, i, cursor;
            for (i = 0; i < cursors.length; i++) {
                cursor = cursors[i];
                if (!elementLookup[cursor.source]) elementLookup[cursor.source] = {};
                if (!elementLookup[cursor.source][cursor.id]) elementLookup[cursor.source][cursor.id] = null;
                windowPoint = {
                    x: Math.round(cursor.getX() * window.innerWidth),
                    y: Math.round(cursor.getY() * window.innerHeight)
                };
                element = elementLookup[cursor.source][cursor.id];
                //Cursor Is Not enabled, check for an object under it
                if (!cursor.isEnabled()) {
                    if (element) {
                        if (element.isAttractor()) {
                            cursor.setAttractor(null);
                            //Release Cursor
                            if (element.hasCursor()) element.release();
                        }
                        this.cursorOut(cursor, element, windowPoint);
                        elementLookup[cursor.source][cursor.id] = null;
                    }
                    continue;
                }
                halfWidth = (cursor.icon.getWidth() / 2);
                halfHeight = (cursor.icon.getHeight() / 2);
                if (!cursor.isCaptured()) {
                    if (cursor.attractor) {
                        bounds = cursor.attractor.element.getBoundingClientRect();
                        destinationPoint = {
                            x: Math.round((bounds.left + (bounds.width / 2)) - halfWidth),
                            y: Math.round((bounds.top + (bounds.height / 2)) - halfHeight)
                        };
                        xDiff = destinationPoint.x - cursor.icon.getX();
                        yDiff = destinationPoint.y - cursor.icon.getY();
                        xRatio = Math.abs(xDiff / (bounds.width / 2));
                        yRatio = Math.abs(yDiff / (bounds.height / 2));
                        if (xRatio > 1) xRatio = 1;
                        if (yRatio > 1) yRatio = 1;
                        xRatio = Math.abs(1 - xRatio);
                        yRatio = Math.abs(1 - yRatio);
                        cursor.setVelocityXYZ(
                        xDiff * Math.max(minPull, Math.min(maxPull, xRatio)), yDiff * Math.max(minPull, Math.min(maxPull, yRatio)), 0);
                        if (Math.abs(cursor.getVelocityX()) <= 0.1 && Math.abs(cursor.getVelocityY()) <= 0.1) {
                            cursor.setVelocityXYZ(0, 0, 0);
                            cursor.icon.setX(destinationPoint.x);
                            cursor.icon.setY(destinationPoint.y);
                            cursor.attractor.capture(cursor);
                        }
                    } else {
                        xDiff = (windowPoint.x - halfWidth) - cursor.icon.getX();
                        yDiff = (windowPoint.y - halfHeight) - cursor.icon.getY();
                        cursor.setVelocityXYZ(xDiff * cursor.getEasing(), yDiff * cursor.getEasing());
                    }
                }
                cursor.icon.setX(cursor.icon.getX() + cursor.getVelocityX());
                cursor.icon.setY(cursor.icon.getY() + cursor.getVelocityY());
                element = this.getCollidingElements(windowPoint);
                originalElement = elementLookup[cursor.source][cursor.id];
                if (element) {
                    if (originalElement == null) {
                        elementLookup[cursor.source][cursor.id] = element;
                        if (element.isAttractor() && !element.hasCursor() && cursor.attractor == null && cursor.captureHost == null) {
                            cursor.setAttractor(element);
                        }
                        this.cursorOver(cursor, element, windowPoint);
                    }
                    this.cursorMove(cursor, element, windowPoint);
                }
                if (originalElement && originalElement !== element) {
                    if (originalElement.isAttractor()) {
                        cursor.setAttractor(null);
                        if (originalElement.hasCursor()) originalElement.release(cursor);
                    }
                    this.cursorOut(cursor, originalElement, windowPoint);
                    elementLookup[cursor.source][cursor.id] = element;
                    if (element) {
                        this.cursorOver(cursor, element, windowPoint);
                        if (element.isAttractor() && cursor.attractor == null && cursor.captureHost == null) {
                            if (!(element.hasCursor())) cursor.setAttractor(element);
                        }
                    }
                }
            }
        },
        cursorOver: function(cursor, element, position) {
            mouseEvent = document.createEvent("MouseEvent");
            mouseEvent.initMouseEvent("mouseover", true, false, window, 1, position.x, position.y, position.x, position.y, false, false, false, false, 0, element);
            element.fireEvent(mouseEvent);
            cursor.onElementOver(element);
        },
        cursorMove: function(cursor, element, position) {
            mouseEvent = document.createEvent("MouseEvent");
            mouseEvent.initMouseEvent("mousemove", true, false, window, 1, position.x, position.y, position.x, position.y, false, false, false, false, 0, element);
            element.fireEvent(mouseEvent);
            cursor.onElementMove(element);
        },
        cursorOut: function(cursor, element, position) {
            mouseEvent = document.createEvent("MouseEvent");
            mouseEvent.initMouseEvent("mouseout", true, false, window, 1, position.x, position.y, position.x, position.y, false, false, false, false, 0, element);
            element.fireEvent(mouseEvent);
            cursor.onElementOut(element);
        },
        getCollidingElements: function(point) {
            var interactiveElements = document.querySelectorAll(INTERACTIVE_SELECTOR + ", " + this.interactiveSelector) || [],
                horizontalPadding, verticalPadding, i, element, bounds, withinXBounds, withinYBounds;
            for (i = 0; i < interactiveElements.length; i++) {
                element = interactiveElements[i];
                if (!LeapManagerUtils.isElementVisible(element)) continue;
                bounds = element.getBoundingClientRect();
                element = LeapManagerUtils.getLeapElement(element);
                horizontalPadding = element.isAttractor() ? element.getAttractorPadding().x : 0;
                verticalPadding = element.isAttractor() ? element.getAttractorPadding().y : 0;
                // console.log(point.x + " : " + (bounds.left - horizontalPadding) + " : " + (bounds.left + bounds.width + horizontalPadding));
                // console.log(point.y + " : " + (bounds.top - verticalPadding) + " : " + (bounds.top + bounds.height + verticalPadding));
                withinXBounds = point.x > (bounds.left - horizontalPadding) && point.x < (bounds.left + bounds.width + horizontalPadding);
                withinYBounds = point.y > (bounds.top - verticalPadding) && point.y < (bounds.top + bounds.height + verticalPadding);
                if (withinXBounds && withinYBounds) {
                    return element;
                }
            }
            return null;
        }
    };
    cursorManager.init(config);
    return cursorManager;
};
var MouseSimulator = (function() {
    var MOUSE_CURSOR_CLASS = "leap-mouse-cursor";
    return {
        cursorManager: null,
        mouseCursor: null,
        init: function(cursorManager, cursorConfig) {
            this.cursorManager = cursorManager;
            var icon = new LeapElement(document.createElement('div'));
            icon.addClass(MOUSE_CURSOR_CLASS);
            var cfg = {
                source: "mouse",
                id: 1,
                icon: icon
            };
            LeapManagerUtils.extendIf(cfg, cursorConfig);
            this.mouseCursor = new Cursor(cfg);
            this.enable();
        },
        enable: function() {
            this._onMouseMove = LeapManagerUtils.bind(this.onMouseMove, this);
            this._onMouseClick = LeapManagerUtils.bind(this.onMouseClick, this);
            document.addEventListener('mousemove', this._onMouseMove);
            document.addEventListener('click', this._onMouseClick);
            this.cursorManager.add(this.mouseCursor);
        },
        disable: function() {
            if (!this.mouseCursor) return;
            document.removeEventListener('mousemove', this._onMouseMove);
            document.removeEventListener('click', this._onMouseClick);
            this.cursorManager.remove(this.mouseCursor);
            this.mouseCursor = null;
        },
        update: function(x, y, z) {
            this.mouseCursor.update(x, y, z);
        },
        onMouseMove: function(event) {
            event = event || window.e;
            var x = 0,
                y = 0,
                z = 0;
            if (event.pageX || event.pageY) {
                x = event.pageX;
                y = event.pageY;
            } else {
                x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
                y = event.clientY + document.body.scollTop + document.documentElement.scrollTop;
            }
            x /= window.innerWidth;
            y /= window.innerHeight;
            z = this.currentZ;
            this.update(x, y, z);
        },
        onMouseClick: function(event) {}
    };
})();

var LeapManager = (function() {
    'use strict';
    var LEAP_POINTABLE_CURSOR_CLASS = "leap-pointable-cursor";
    var defaultConfig = {
        maxCursors: 1,
        simulateWithMouse: false,
        enableInBackground: false,
        root: null,
        gestureCallback: null,
        gestureScope: null,
        interactiveSelector: null,
        enableSenchaTouch: false,
        boundary: {
            top: 350,
            left: -100,
            right: 100,
            bottom: 150
        },
        cursorConfig: {
            multitapEnabled: false,
            clickDelay: 1000
        },
        mouseCursorConfig: {
            multitapEnabled: false,
            clickDelay: 1000
        },
        loopConfig: {
            enableGestures: true
        }
    };
    return {
        cursorManager: null,
        cursors: [],
        init: function(config) {
            LeapManagerUtils.extendIf(config, defaultConfig);
            this.boundary = config.boundary;
            this.maxCursors = config.maxCursors;
            this.simulateWithMouse = config.simulateWithMouse;
            this.gestureCallback = config.gestureCallback;
            this.gestureScope = config.gestureScope;
            this.cursorConfig = config.cursorConfig;
            //Sencha Touch Switch
            if (config.enableSenchaTouch) {
                if (config.interactiveSelector == null) {
                    config.interactiveSelector = "";
                } else {
                    config.interactiveSelector += ",";
                }
                config.interactiveSelector += ["a", ".x-tab", ".x-button", ".x-video-ghost"].join(",");
            }
            this.cursorManager = new CursorManager({
                root: config.root,
                interactiveSelector: config.interactiveSelector
            });
            if (this.simulateWithMouse) MouseSimulator.init(this.cursorManager, config.mouseCursorConfig || {});
            //Active Tab/Window Checking
            var me = this;
            me.isActiveWindow = true;
            if (!config.enableInBackground) {
                window.addEventListener('blur', function() {
                    me.isActiveWindow = false;
                });
                window.addEventListener('focus', function() {
                    me.isActiveWindow = true;
                });
            }
            var callback = function(frame) {
                    me.onLoop(frame);
                };
            if(Leap !== null) Leap.loop(config.loopConfig, callback);
        },
        onLoop: function(frame) {
            if (!this.isActiveWindow) return;
            this.cursorManager.update();
            this.updatePointables(frame);
            this.updateGestures(frame);
        },
        updatePointables: function(frame) {
            var pointable, pointableIndex, cursor, posX, posY, posZ, cursorIndex, currentCursors = [];
            if (frame && frame.pointables) {
                for (pointableIndex = 0; pointableIndex < frame.pointables.length && pointableIndex < this.maxCursors; pointableIndex++) {
                    pointable = frame.pointables[pointableIndex];
                    if (pointable) {
                        posX = LeapManagerUtils.map(pointable.tipPosition[0], this.boundary.left, this.boundary.right, 0, 1);
                        posY = LeapManagerUtils.map(pointable.tipPosition[1], this.boundary.bottom, this.boundary.top, 1, 0);
                        posZ = 0;
                        cursor = this.getCursor(pointable.id, {
                            x: posX,
                            y: posY,
                            z: posZ
                        });
                        currentCursors.push(cursor.id);
                        cursor.update(posX, posY, posZ);
                    }
                }
            }
            var activeCursors = {};
            for (cursorIndex in this.cursors) {
                cursor = this.cursors[cursorIndex];
                if (currentCursors.indexOf(cursor.id) === -1) {
                    this.cursorManager.remove(cursor);
                } else {
                    activeCursors[cursor.id] = cursor;
                }
            }
            this.cursors = activeCursors;
        },
        getCursor: function(id, position) {
            if (this.cursors[id]) {
                return this.cursors[id];
            }
            var icon = new LeapElement(document.createElement('div'));
            icon.addClass(LEAP_POINTABLE_CURSOR_CLASS);
            var cfg = {
                source: "leap",
                id: id,
                position: position,
                icon: icon
            };
            LeapManagerUtils.extend(cfg, this.cursorConfig);
            var cursor = this.cursors[id] = new Cursor(cfg);
            this.cursorManager.add(cursor);
            return cursor;
        },
        updateGestures: function(frame) {
            var me = this,
                cursor;
            if (frame.gestures.length > 0) {
                frame.gestures.forEach(function(gesture) {
                    // if(gesture.state == "stop") {
                    if (gesture.pointableIds && gesture.pointableIds.length > 0) {
                        gesture.pointableIds.forEach(function(pointableId) {
                            if (me.cursors && me.cursors[pointableId]) {
                                cursor = me.cursors[pointableId];
                                if (cursor) {
                                    if (cursor.hasElement()) {
                                        var evt = document.createEvent("Event");
                                        evt.initEvent("leap-"+gesture.type, true, true);
                                        evt.state = gesture.state;
                                        evt.gesture = gesture;
                                        cursor.element.fireEvent(evt);

                                        evt = document.createEvent("Event");
                                        evt.initEvent("leap-"+gesture.type+"-"+gesture.state, true, true);
                                        evt.state = gesture.state;
                                        evt.gesture = gesture;
                                        cursor.element.fireEvent(evt);
                                    }
                                    if (me.gestureCallback) {
                                        me.gestureCallback.call(me.gestureScope || me, gesture);
                                    }
                                }
                            }
                        });
                    }
                    // }
                });
            }
        }
    };
})();