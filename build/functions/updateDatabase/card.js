"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardImage = exports.CardSet = exports.Card = void 0;
class CardSet {
    constructor(input) {
        this.setCode = input.set_code;
        this.setName = input.set_name;
        this.setPrice = input.set_price;
        this.setRarity = input.set_rarity;
    }
}
exports.CardSet = CardSet;
class CardImage {
    constructor(input) {
        this.id = input.id;
        this.imageUrl = input.image_url;
        this.imageSmall = input.image_url_small;
        this.imageCropped = input.image_url_cropped;
    }
}
exports.CardImage = CardImage;
class Card {
    constructor(input) {
        this.id = input.id;
        this.name = input.name;
        this.type = input.type;
        this.frameType = input.frameType;
        this.desc = input.desc;
        this.race = input.race;
        this.atk = input.atk;
        this.def = input.def;
        this.level = input.level;
        this.attribute = input.attribute;
        this.archetype = input.archetype;
        this.scale = input.scale;
        this.link = input.linkval;
        this.linkMarkers = input.linkmarkers;
        this.cardSets = [];
        this.cardImages = [];
        if (input.card_sets != null) {
            input.card_sets.forEach((cardSet) => this.cardSets.push(new CardSet(cardSet)));
        }
        if (input.card_images != null) {
            input.card_images.forEach((cardImage) => this.cardImages.push(new CardImage(cardImage)));
        }
    }
}
exports.Card = Card;
