define([
	'jquery',
	'poly',
	'underscore',
	'../base/main',
	"troopjs-core/pubsub/hub",
	"jquery.flip",
	"template!./flashcard-presentation.html"
], function FlashCardPresentation($, poly, _, Widget, Hub, flip$, tTemplate) {
	"use strict";

	// TODO: constants
	var SEL_ITEM = ".ets-act-fcp-item",
		SEL_CARD = ".ets-act-fcp-card",
		SEL_CARD_FRONT = ".ets-act-fcp-card-front",
		SEL_CARD_BACK = ".ets-act-fcp-card-back",
		SEL_CARD_ACTION = ".ets-act-fcp-card-action",
		SEL_CARD_IMG = ".ets-act-fcp-card-img",
		SEL_CARD_TXT = ".ets-act-fcp-card-text",
		SEL_CARD_FLIP = ".ets-act-fcp-flip",
		SEL_FOGGY_ITEM = ".ets-act-fcp-item.ets-foggy",
		SEL_CARD_TRANS = ".ets-act-fcp-card-translation",
		SEL_CARD_TITLE = "> h4",
		SEL_PRONOUNCE = "> .ets-pronunciation > span",
		SEL_TRANS = "> .ets-translation .ets-translation-title",
		SEL_DEFINITION = "> .ets-definition",
		SEL_EXAMPLES = "> .ets-example ol",
		SEL_AUDIO_PLAYER = "#ets-act-fcp-audio-player",

		CLS_NONE = "ets-none",
		CLS_ACTIVE = "ets-active",
		CLS_FOGGY = "ets-foggy",
		CLS_FLIP_BACK = "ets-act-fcp-back",

		DURATION_FADE_OUT = 100,
		DURATION_FADE_IN = 200,

		EN = "en",
		ANAT = "Anat",

		HUB_CONTEXT = "context";

	function flipCard() {
		var me = this,
			fliped = me._cardFlipped;

		flip$(me._$card).flip({
			direction: fliped ? 'lr' : 'rl',
			bgColor: '#eee',
			speed: 300,
			onEnd: function () {
				me._$cardFront.toggleClass(CLS_NONE, !fliped);
				me._$cardBack.toggleClass(CLS_NONE, fliped);
				me._$btnFlip.toggleClass(CLS_FLIP_BACK, !fliped);
				me._$card.removeAttr("style");
				me._cardFlipped = !me._cardFlipped;
			}
		});
	}

	function selectItem(item) {
		var me = this;

		var $item = $(item);
		if ($item.hasClass(CLS_ACTIVE)) {
			return;
		}
		clearTimeout(me.playTimeoutId);
		me._$items.not($item).removeClass(CLS_ACTIVE);
		$item.addClass(CLS_ACTIVE);
		$item.removeClass(CLS_FOGGY);

		var $img = $item.find("img").clone();
		var index = $item.data("index");
		var data = me._json.content.flashCards[index];
		var audioSrc = data.audio.url;
		var text = data.txt;

		var $phImg = this._$phImage;
		var fadeInImg = function () {
			$phImg.hide().html($img).fadeIn(DURATION_FADE_IN);
		};
		if ($phImg.children().length) {
			$phImg.fadeOut(DURATION_FADE_OUT, fadeInImg);
		} else {
			fadeInImg();
		}

		me._$phText.text(text);

		switchTrans.call(me, data);
		if (me._cardFlipped) {
			flipCard.call(me);
		}

		//Pause a while before play, for a smooth user experience
		me.playTimeoutId = setTimeout(function () {
			$(SEL_AUDIO_PLAYER).trigger("player/play", audioSrc);
		}, 500);

		//Move on when all cards read
		if (!this.$element.find(SEL_FOGGY_ITEM).length) {
			this.items().completed(true);
		}
	}

	function switchTrans(data) {
		var trans = data.translation,
			title = data.txt,
			me = this;

		if (!trans) return;

		var tagPre = "<li><span>",
			tagMid = "</span></li><li><span>",
			tagSuff = "</span></li>",
			br = "<br/>&nbsp;&nbsp;&nbsp;&nbsp;",
			pron = $.trim(trans.phoneticSpelling),
			sampleSentences = [];

		if (_.isArray(trans.sampleSentences)) {
			trans.sampleSentences.forEach(function (smpl) {
				var sentence,
					trans = "";

				if (!smpl) return;

				if (_.isObject(smpl)) {
					if (me.isNeedShowTrans && smpl["value"] != smpl["key"]) {
						trans = br + ['<span class="ets-translation">', smpl["value"], '</span>'].join('');
					} else {
						trans = "";
					}
					sentence = smpl["key"] + trans;

					sampleSentences.push(sentence);
				} else {
					sampleSentences.push(smpl);
				}
			});
		}

		var samplesHTML = sampleSentences.length
			? (tagPre + sampleSentences.join(tagMid) + tagSuff)
			: "";

		//Check whether have '/' in prons, if not, wrap '/'.
		pron = (pron.length && pron.indexOf("/") !== 0) ? ('/' + pron + '/') : pron;

		this._$trans
			.find(SEL_CARD_TITLE)
			.text(title)
			.end()
			.find(SEL_TRANS)
			.text(trans.translation == title ? "" : trans.translation)
			.end()
			/*
			 //currently, content not supply a partofspeech
			 .find(SEL_TRANS_POSPE)
			 .text(trans.partofspeech)
			 .end()
			 */
			.find(SEL_DEFINITION)
			.text(trans.definition)
			.end()
			.find(SEL_EXAMPLES)
			.html(samplesHTML)
			.end()
			.find(SEL_PRONOUNCE)
			.text(pron);
	}

	return Widget.extend({
		"sig/start": function () {
			var me = this;
			me._cardFlipped = false;
			me.type(Widget.ACT_TYPE.LEARNING);
		},
		"sig/render": function onRender() {
			var $el = this.$element,
				isENCulture,
				isAnatPartner,
				me = this;

			me.isNeedShowTrans = true;

			function onContext(context) {
				if (context) {
					isENCulture = context.cultureCode === EN;
					isAnatPartner = context.partnerCode === ANAT;

					me.isNeedShowTrans = !isENCulture && !isAnatPartner;
				}
			}

			Hub.subscribe(HUB_CONTEXT, Hub, onContext);
			Hub.reemit(HUB_CONTEXT, false, Hub, onContext);
			Hub.unsubscribe(HUB_CONTEXT, Hub, onContext);

			return me.renderPromise = me
				.html(tTemplate, {
					flashCards: me._json.content.flashCards,
					hasPassed: me.hasPassed
				})
				.then(function () {
					me._$items = $el.find(SEL_ITEM);
					me._$card = $el.find(SEL_CARD);
					me._$cardFront = $el.find(SEL_CARD_FRONT);
					me._$cardBack = $el.find(SEL_CARD_BACK);
					me._$phImage = $el.find(SEL_CARD_IMG);
					me._$phText = $el.find(SEL_CARD_TXT);
					me._$btnFlip = $el.find(SEL_CARD_FLIP);
					me._$trans = $el.find(SEL_CARD_TRANS);

					selectItem.call(me, me._$items[0]);

					if (me._json.templateCode === "FlaPreFlip" && me._json.canFlipCard) {
						$el.find(SEL_CARD_ACTION).removeClass(CLS_NONE);
					}
				});
		},
		"sig/finalize": function onInitialize() {
			var me = this;

			var $card = flip$(me._$card);
			//1. clear potencial timer to avoid submit wrong score
			$card.stop(true, true);

			me.renderPromise && me.renderPromise.ensure(function () {
				me._$items = null;
				me._$card = null;
				me._$cardFront = null;
				me._$cardBack = null;
				me._$phImage = null;
				me._$phText = null;
				me._$btnFlip = null;
				me._$trans = null;
			});
		},
		"dom:.ets-act-fcp-item/click": function onSwitchCrad($event) {
			selectItem.call(this, $event.currentTarget);
		},
		"dom:.ets-act-fcp-flip/click": function onSwitchCrad() {
			flipCard.call(this);
		}
	});
});
