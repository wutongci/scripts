define(['jquery',
    'template!./index.html'
], function($, template) {
    'use strict';

    var UNDEF;

    var DAY_MAX_SECONDS = 24 * 60 * 60;
    var timeProcessor = {
        convertToObject: function(seconds) {
            return {
                hh: this.extractDigits((seconds / 3600) >>> 0),
                mm: this.extractDigits(((seconds % 3600) / 60) >>> 0),
                ss: this.extractDigits(seconds % 60)
            };
        },
        extractDigits: function(number) {
            if (number < 10) {
                return {
                    ones: number,
                    tens: 0
                };
            }
            var digits = ('' + number).split('');
            return {
                ones: digits[1] >>> 0,
                tens: digits[0] >>> 0
            };
        },
        updateDigits: function(seconds) {

        }
    };

    function animationSupport($el) {
        var animation = false,
            animationstring = 'animation',
            keyframeprefix = '',
            domPrefixes = 'Webkit Moz O ms Khtml'.split(' '),
            pfx = '';
        var elm = $el[0];

        if (elm.style.animationName) {
            animation = true;
        }

        if (animation === false) {
            for (var i = 0; i < domPrefixes.length; i++) {
                if (elm.style[domPrefixes[i] + 'AnimationName'] !== undefined) {
                    pfx = domPrefixes[i];
                    animationstring = pfx + 'Animation';
                    keyframeprefix = '-' + pfx.toLowerCase() + '-';
                    animation = true;
                    break;
                }
            }
        }
        return animation;
    }

    function scoreboard(options) {
        options = $.extend({
            finished: false,
            paused: false
        }, options);

        // fix width and position for different languages
        var $el = options.$el;
        var removeNeeded = false;
        if (!$.contains(document.body, $el[0])) {
            removeNeeded = true;
            $el.appendTo('body');
        }

        var $boards = $el.find('.countdown-scoreboard-boards');
        var $enter = $el.find('.countdown-scoreboard-enter');
        var $waitting = $el.find('.countdown-scoreboard-waitting');
        $enter.css('left', 0);

        if (removeNeeded) {
            $el.remove();
        }

        // ATEAM-873 - study plan bar shaking when count down is counting
        var animationSupported = false; //animationSupport($el);
        if (animationSupported) {
            $el.on('animationend webkitAnimationEnd msAnimationend oAnimationEnd', '.animation', function() {
                var $this = $(this).removeClass('animation');
                if ($this.is('.bottom-animation')) {
                    $this.siblings('.top-animation').html($this.siblings('.bottom').html());
                }
                if ($this.is('.top-animation')) {
                    $this.siblings('.top').html($this.html());
                }
            });
        } else {
            $el.find('.top-animation, .bottom-animation').remove();
        }

        return {
            $el: $el,
            disabled: false,

            checkPoints: {
                afterEnd: {},
                beforeEnd: {}
            },
            secondTimer : UNDEF,
            afterEndTimer : [],
            timeoutTimer : UNDEF,
            timeIn: options.timeIn,
            enterClickHandler: $.noop,
            secondsLeft: options.timeIn,
            timeOut: options.timeOut,
            timeOutHandler: $.noop,
            startHandler : $.noop,

            afterEnd: function(seconds, f) {
                var me = this;
                me.checkPoints.afterEnd[seconds] = f;
                return me;
            },
            beforeEnd: function(seconds, f) {
                var me = this;
                me.checkPoints.beforeEnd[seconds] = f;
                return me;
            },
            disableEnter: function() {
                var me = this;
                me.disabled = true;
                me.$el.find('.countdown-scoreboard-enter')
                    .addClass('disabled');
                return me;
            },
            onDurationEnd: function() {
                var me = this;
                me.finished = true;
                var $el = me.$el;

                if (me.timeOut) {
                    me.timeoutTimer && clearTimeout(timeoutTimer);
                    me.timeoutTimer = setTimeout(me.timeOutHandler, 1000 * (me.timeOut - me.timeIn));
                }
                $.each(me.checkPoints.afterEnd, function(seconds, f) {
                    me.afterEndTimer.push(
                        setTimeout(function() {
                            f.apply(me);
                        }, 1000 * seconds)
                    );
                });
                return me;
            },
            onEnterClick: function(f) {
                var me = this;
                me.enterClickHandler = f;
                return me;
            },
            onTimeout: function(f) {
                var me = this;
                me.timeOutHandler = f;
                return me;
            },
            onStart : function(f){
                var me = this;
                me.startHandler = f;
                return me;
            },
            pause: function() {
                var me = this;
                me.paused = true;
                return me;
            },
            start: function() {
                var me = this;
                var $el = me.$el;

                if(me.secondsLeft){
                    // resotre the state of html and css
                    // Initialize scoreboard UI
                    me.updateBoards(0, me.secondsLeft);
                    // Flip loop
                    (function flipScoreboard() {
                        if (me.finished || me.paused) {
                            return;
                        }
                        if (me.secondsLeft === 0) {
                            me.onDurationEnd();
                            return;
                        }

                        var oldTime = me.secondsLeft;
                        var newTime = --me.secondsLeft;
                        me.updateBoards(oldTime, newTime);
                        if (me.checkPoints.beforeEnd[me.secondsLeft]) {
                            me.checkPoints.beforeEnd[me.secondsLeft]();
                        }
                        me.secondTimer = setTimeout(flipScoreboard, 1000);
                    })();     
                    me.startHandler();               
                }
                else{
                    me.checkPoints.beforeEnd[0] && me.checkPoints.beforeEnd[0]();
                    me.onDurationEnd();
                }


                return me;
            },
            updateBoard: function(boardName, digits) {
                var me = this;
                var $board = me.$el.find('.' + boardName);
                var oldDigits = digits.oldDigits;
                var newDigits = digits.newDigits;

                $board
                    .find('.tens').text(newDigits.tens)
                    .end()
                    .find('.ones').text(newDigits.ones);
                if (animationSupported) {
                    $board
                        .find('.top .tens, .top-animation .tens, .bottom-animation .tens').text(oldDigits.tens)
                        .end()
                        .find('.top .ones, .top-animation .ones, .bottom-animation .ones').text(oldDigits.ones)
                        .end()
                        .find('.bottom-animation, .top-animation').addClass('animation');
                }
                return me;
            },
            updateBoards: function(oldTime, newTime) {
                var me = this;
                var boards = ['hh', 'mm', 'ss'];
                var digitsStateCheckNeeded = true;
                oldTime = timeProcessor.convertToObject(oldTime);
                newTime = timeProcessor.convertToObject(newTime);
                for (var i = 0; i < boards.length; i++) {
                    var board = boards[i];
                    var oldDigits = oldTime[board];
                    var newDigits = newTime[board];
                    if (newDigits.tens !== oldDigits.tens || newDigits.ones !== oldDigits.ones) {
                        me.updateBoard(boards[i], {
                            oldDigits: oldDigits,
                            newDigits: newDigits
                        });
                    }

                    // TODO: improve performance
                    // disabled preceding zeros
                    var digits = ['tens', 'ones'];
                    var $digit;
                    for (var j = 0; j < digits.length; j++) {
                        $digit = me.$el.find('.' + board + ' .' + digits[j]);
                        if (digitsStateCheckNeeded) {
                            if (!newDigits[digits[j]]) {
                                $digit.removeClass('enabled').addClass('disabled');
                            } else {
                                $digit.removeClass('disabled').addClass('enabled');
                                digitsStateCheckNeeded = false;
                            }
                        } else {
                            $digit.removeClass('disabled').addClass('enabled');
                        }
                    }
                }
                return me;
            }
        };
    }

    var w = function() {
        var $template = $(template());

        var o = {};
        o.$el = $template.appendTo('body').remove();
        o.init = function(options) {
            var me = this;

            if (!options) {
                options = {};
                throw ("Init should have an input object.");
            }

            var timeIn = options.timeIn;
            var timeOut = options.timeOut;
            if (isNaN(timeIn)) {
                options.timeIn = DAY_MAX_SECONDS - 1;
                throw ("timeIn should be a number.");
            } else if (timeIn >= DAY_MAX_SECONDS) {
                options.timeIn = DAY_MAX_SECONDS - 1;
                throw ("timeIn should little than 24 * 60 * 60.");
            } else if (timeIn < 0) {
                options.timeIn = 0;
                //throw ("timeIn can't be a minus.");
            } else if (typeof timeOut === "number" && timeOut <= timeIn) {
                // timeOut should greater than timeIn,
                // or timeOut === 0
                options.timeOut = 0;
            }
            // Reset timeIn to 1s
            // Slow render Enter, waiting for blurbs
            // if (options.timeIn === 0) {
            //     options.timeIn = 1;
            // }

            var countdown = scoreboard($.extend(options, {
                $el: me.$el
            }));

            //wait a single tick for onTimeout/onStart execute
            setTimeout(function(){
                countdown.start();
            }, 0);

            return {
                afterEnd: function(seconds, f) {
                    var me = this;
                    if (seconds >= 0) {
                        countdown.afterEnd(seconds, f);
                    }
                    return me;
                },
                beforeEnd: function(seconds, f) {
                    var me = this;
                    if (0 <= seconds) {
                        if(seconds <= countdown.secondsLeft){
                            countdown.beforeEnd(seconds, f);
                        }
                        else{
                            f && f();
                        }
                    }
                    return me;
                },
                disableEnter: function() {
                    var me = this;
                    countdown.disableEnter();
                    return me;
                },
                onEnd: function(f) {
                    var me = this;
                    this.afterEnd(0, f);
                    return me;
                },
                onEnterClick: function(f) {
                    var me = this;
                    countdown.onEnterClick(f);
                    return me;
                },
                onTimeout: function(f) {
                    var me = this;
                    countdown.onTimeout(f);
                    return me;
                },
                onStart: function(f) {
                    var me = this;
                    countdown.onStart(f);
                    return me;
                },
                // TODO: to be continued
                restart: function() {
                    countdown.start();
                },
                //stop all the timeout
                stop : function(){
                    countdown.secondTimer && clearTimeout(countdown.secondTimer);
                    countdown.timeoutTimer && clearTimeout(countdown.timeoutTimer);
                    countdown.afterEndTimer.forEach(function(timer){
                        clearTimeout(timer);
                    });
                    return this;
                }
            };
        };
        return o;
    };
    return w;
});
