define({
    /**
     * General English
     */
    GeneralEnglish: "GE",

    /**
     * Business English SPIN
     */
    BusinessEnglish: "BE",

    /**
     * Industry English SPIN
     */
    IndustryEnglish: "IND",

    /**
     * B2B Industry English SPIN
     */
    IndustryEnglishB2B: "INDB2B",

    /**
     * ILS Industry English SPIN
     */
    IndustryEnglishILS: "INDILS",

    /**
     * Travel English
     */
    TravelEnglish: "TRV",

    /**
     * English for Food Service
     */
    FoodEnglish: "FSE",

    /**
     * English for Hospitality
     */
    HospitalityEnglish: "HE",

    /**
     * English for Security
     */
    SecurityEnglish: "SE",

    /**
     * check if the course is GE by courseTypeCode
     * @param {String} courseTypeCode
     * @return {Boolean} true is GE course else is not
     * @api public
     */
    isGECourse: function onCheckGECourse(courseTypeCode) {
        return this.GeneralEnglish === ("" + courseTypeCode).toUpperCase();
    },

    /**
     * check if the course is BE by courseTypeCode
     * @param {String} courseTypeCode
     * @return {Boolean} true is BE course else is not
     * @api public
     */
    isBECourse: function onCheckBECourse(courseTypeCode) {
        return this.BusinessEnglish === ("" + courseTypeCode).toUpperCase();
    },

    /**
     * check if the course is SPIN by courseTypeCode
     * @param {String} courseTypeCode
     * @return {Boolean} true is SPIN course else is not
     * @api public
     */
    isSpinCourse: function onCheckSpinCourse(courseTypeCode) {
        return !this.isGECourse(courseTypeCode);
    }
});
