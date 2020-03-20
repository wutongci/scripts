define(["module", "jquery", "template!./index.html"], function(module, $, template) {
    'use strict';

    function keySupport() {
        var ua = navigator.userAgent;
        return ua.indexOf("Windows NT") >= 0 || ua.indexOf("Macintosh") >= 0;
    }

    function cssAnimate($el, noAnimation) {
        if (!$el || $el.length <= 0) {
            return {
                "popIn": $.noop,
                "popOut": $.noop
            };
        }
        // Add animate CSS?
        if (noAnimation) {
            $el.removeClass("popupbox-pop");
        } else {
            $el.addClass("popupbox-pop");
        }
        return {
            "popIn": function() {
                $el.removeClass("popupbox-out").addClass("popupbox-in");
            },
            "popOut": function() {
                $el.removeClass("popupbox-in").addClass("popupbox-out");
            }
        };
    }

    var Popupbox = function(args) {
        this.el = args.el || "body";
        this.body = this.el === "body" ? true : false;
        this.msg = args.msg || "";
        // overLap: "cancel"/"replace"/"overlap"
        this.overLap = args.overLap || "replace";
        // stick at top of the popup
        this.stick = args.stick || false;
        // In stick mode, keep a gap to top
        this.stickTop = args.stickTop || 0;
        // Gap between object element & popup box(e.g. Show Header while popup)
        this.top = args.top || 0;
        // Support animation?
        this.noAnimation = args.noAnimation || false;
        // styling
        this.bgColor = args.bgColor || "#000";
        this.opacity = args.opacity || 0.6;
        this.zIndex = args.zIndex || 1;
        this.fullSize = args.fullSize || false;
        // button options
        this.closeble = args.closeble || false;
        this.closeButtonHide = args.closeButtonHide || false;
        this.closeButtonList = args.closeButtonList || [];
        this.closeInner = args.closeInner || false;
        this.closeCallback = args.closeCallback || $.noop;
    };

    Popupbox.prototype = {
        "open": function() {
            var me = this;
            var deferred = $.Deferred();
            var $container = $(me.el);

            function evClose() {
                // Attach close buttons events
                if (me.closeButtonList.length > 0) {
                    // Read all the buttons
                    $.each(me.closeButtonList, function(i, el) {
                        // Events
                        me.$popupBox.on("click", el, function(e) {
                            e.preventDefault();
                            me.close();
                        });
                    });
                }
            }

            function escClose() {
                var $keySupportInput = me.$popupBoxCover.find("input.popupbox-keysupport");
                if ($keySupportInput.length > 0) {
                    $keySupportInput.focus().keydown(function(e) {
                        if (e.which == 27) {
                            me.close();
                        }
                        e.preventDefault();
                    });
                }
            }

            function resize() {
                $(window).resize(function(e) {
                    me.centralize();
                });
            }

            // If the container doesn't exist, use body instead.
            if ($container.length <= 0) {
                $container = $("body");
            }
            // overlap
            var $existPopupBox = $container.find(" > div.popupbox, > div.popupbox-cover");
            if ($existPopupBox.length > 0) {
                if (me.overLap === "cancel") {
                    deferred.reject();
                    return deferred.promise();
                } else if (me.overLap === "replace") {
                    $existPopupBox.remove();
                }
            }
            // Generate the html
            me.$popupBoxWrapper = $(template({
                "position": me.body ? "fixed" : "absolute",
                "bgColor": me.bgColor,
                "opacity": me.opacity,
                "zIndex": me.zIndex,
                "top": me.top,
                "fullSize": me.fullSize,
                "keySupport": keySupport(),
                "hasCloseButton": (me.closeble && !me.closeButtonHide),
                "isInnerClose": me.closeInner
            }));
            me.$popupBoxCover = me.$popupBoxWrapper.filter(".popupbox-cover");
            me.$popupBox = me.$popupBoxWrapper.filter(".popupbox");
            me.$popupBoxMain = me.$popupBox.find(".popupbox-main");
            me.$popupBoxContent = me.$popupBox.find(".popupbox-content");

            // Register window resize event
            if (!me.stick) {
                resize();
            }
            // Append Content, use 'prepend' to make 'close button' render at the end.
            me.$popupBoxContent.prepend(me.msg);
            // Append to DOM
            me.$popupBoxWrapper.appendTo($container);
            // Append close button
            if (me.closeble) {
                me.closeButtonList.push("a.popupbox-close");
                // Attach close events
                evClose();
                // Attach ESC key event
                escClose();
            }
            // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+ //
            // Centralize the content
            me.centralize();
            // Show popup box
            if (me.noAnimation) {
                // Show Cover
                me.$popupBoxCover.show();
                // Show Content
                cssAnimate(me.$popupBoxContent, true).popIn();
                // Resolve
                deferred.resolve(me.$popupBoxContent);
            } else {
                // Show Cover
                me.$popupBoxCover.fadeIn(400, function() {
                    // Show Content after Cover showed
                    cssAnimate(me.$popupBoxContent).popIn();
                    // Resolve
                    deferred.resolve(me.$popupBoxContent);
                });
            }
            return deferred.promise();
        },
        "close": function(noCallback) {
            var me = this;
            var deferred = $.Deferred();

            function callback() {
                if (!noCallback) {
                    me.closeCallback();
                }
            }
            if (me.noAnimation) {
                // Hide Content
                cssAnimate(me.$popupBoxContent, true).popOut();
                // Hide Cover
                me.$popupBoxCover.hide();
                // Run close callback
                callback();
                // Remove popup elements
                me.$popupBoxWrapper.remove();
                // Resolve
                deferred.resolve($);
            } else {
                // Hide Content
                cssAnimate(me.$popupBoxContent).popOut();
                window.setTimeout(function() {
                    // Hide Cover after Content hid
                    me.$popupBoxCover.fadeOut(200, function() {
                        // Run close callback after cover hid
                        callback();
                        // Remove popup elements
                        me.$popupBoxWrapper.remove();
                        // Resolve
                        deferred.resolve($);
                    });
                }, 100);
            }
            return deferred.promise();
        },
        "centralize": function() {
            var me = this;
            // $out: Cover
            var $out = me.$popupBox;
            // $in: Content
            var $in = me.$popupBoxContent;
            // Get height of both container & content
            var hOut = $out.height();
            var hIn = $in.outerHeight();
            // calculate: keep top while stick, otherwise centralize the content in vertical
            var mTop = me.stick ? me.stickTop : Math.floor((hOut - hIn) / 2);
            // Never hide or be cut
            mTop = mTop < 0 ? 0 : mTop;
            // Apply to dom
            $in.css("margin-top", mTop);
            return me;
        }
    };
    return Popupbox;
});
