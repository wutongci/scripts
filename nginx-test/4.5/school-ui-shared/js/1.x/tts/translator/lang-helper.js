/**
 * # language map helper module definition
 */
define([
    "compose"
], function LangHelperModule(Compose) {
    "use strict";

    /*!
     * culture code need to be mapped
     */
    var CULTURE_CODE_ES_CL = "es-CL",
        CULTURE_CODE_ID_ID = "id-ID",
        CULTURE_CODE_JA_JP = "ja-JP",
        CULTURE_CODE_KO_KR = "ko-KR",
        CULTURE_CODE_PT_BR = "pt-BR",
        CULTURE_CODE_ZH_CN = "zh-CN",
        CULTURE_CODE_ZH_HK = "zh-HK",
        CULTURE_CODE_ZH_TW = "zh-TW";

    /*!
     * bing language code need to be mapped
     *
     * Language codes representing languages that are supported by BING Translation Service
     * ar,bg,ca,zh-CHS,zh-CHT,cs,da,nl,en,et,fi,fr,de,el,ht,he,hi,mww,
     * hu,id,it,ja,ko,lv,lt,no,fa,pl,pt,ro,ru,sk,sl,es,sv,th,tr,uk,vi
     *
     * ref URL: http://api.microsofttranslator.com/V2/Ajax.svc/GetLanguagesForTranslate?appId=XXX
     */
    var BING_LANG_CODE_DE = "de",
        BING_LANG_CODE_ES = "es",
        BING_LANG_CODE_ID = "id",
        BING_LANG_CODE_JA = "ja",
        BING_LANG_CODE_KO = "ko",
        BING_LANG_CODE_PT = "pt",
        BING_LANG_CODE_ZH_CHS = "zh-CHS",
        BING_LANG_CODE_ZH_CHT = "zh-CHT";

    /*!
     * EF non-stardand language code need to be mapped
     */
    var EF_LANG_CODE_CH = "ch",
        EF_LANG_CODE_CS = "cs",
        EF_LANG_CODE_GE = "ge",
        EF_LANG_CODE_HK = "hk",
        EF_LANG_CODE_ID = "id",
        EF_LANG_CODE_JP = "jp",
        EF_LANG_CODE_KR = "kr",
        EF_LANG_CODE_SP = "sp",
        EF_LANG_CODE_PT = "pt";

    /*!
     * language code map from culture code/EF language code to bing language code
     */
    var AS_BING_LANG = {}, AS_EF_LANG = {};
    AS_BING_LANG[CULTURE_CODE_ES_CL] = BING_LANG_CODE_ES;
    AS_BING_LANG[CULTURE_CODE_ID_ID] = BING_LANG_CODE_ID;
    AS_BING_LANG[CULTURE_CODE_JA_JP] = BING_LANG_CODE_JA;
    AS_BING_LANG[CULTURE_CODE_KO_KR] = BING_LANG_CODE_KO;
    AS_BING_LANG[CULTURE_CODE_PT_BR] = BING_LANG_CODE_PT;
    AS_BING_LANG[CULTURE_CODE_ZH_CN] = BING_LANG_CODE_ZH_CHS;
    AS_BING_LANG[CULTURE_CODE_ZH_HK] = BING_LANG_CODE_ZH_CHT;
    AS_BING_LANG[CULTURE_CODE_ZH_TW] = BING_LANG_CODE_ZH_CHT;

    AS_BING_LANG[EF_LANG_CODE_CH] = BING_LANG_CODE_ZH_CHT;
    AS_BING_LANG[EF_LANG_CODE_CS] = BING_LANG_CODE_ZH_CHS;
    AS_BING_LANG[EF_LANG_CODE_GE] = BING_LANG_CODE_DE;
    AS_BING_LANG[EF_LANG_CODE_HK] = BING_LANG_CODE_ZH_CHT;
    AS_BING_LANG[EF_LANG_CODE_ID] = BING_LANG_CODE_ID;
    AS_BING_LANG[EF_LANG_CODE_JP] = BING_LANG_CODE_JA;
    AS_BING_LANG[EF_LANG_CODE_KR] = BING_LANG_CODE_KO;
    AS_BING_LANG[EF_LANG_CODE_SP] = BING_LANG_CODE_ES;
    AS_BING_LANG[EF_LANG_CODE_PT] = BING_LANG_CODE_PT;

    /*!
     * language code map from culture code to EF language code
     */
    AS_EF_LANG[CULTURE_CODE_ES_CL] = EF_LANG_CODE_SP;
    AS_EF_LANG[CULTURE_CODE_ID_ID] = EF_LANG_CODE_ID;
    AS_EF_LANG[CULTURE_CODE_JA_JP] = EF_LANG_CODE_JP;
    AS_EF_LANG[CULTURE_CODE_KO_KR] = EF_LANG_CODE_KR;
    AS_EF_LANG[CULTURE_CODE_PT_BR] = EF_LANG_CODE_PT;
    AS_EF_LANG[CULTURE_CODE_ZH_CN] = EF_LANG_CODE_CS;
    AS_EF_LANG[CULTURE_CODE_ZH_HK] = EF_LANG_CODE_CH;
    AS_EF_LANG[CULTURE_CODE_ZH_TW] = EF_LANG_CODE_CH;

    return Compose.create({
        "getBingLangByCultureCode": function onGetBingLangByCultureCode(cultureCode) {
            return AS_BING_LANG[cultureCode] || cultureCode;
        },

        "getEFLangByCultureCode": function onGetEFLangByCultureCode(cultureCode) {
            return AS_EF_LANG[cultureCode] || cultureCode;
        },

        "getBingLangByEFLang": function onGetBingLangByEFLang(eflangCode) {
            return AS_BING_LANG[eflangCode] || eflangCode;
        }
    });
});
