interface CardSetInput {
  set_name: string;
  set_code: string;
  set_rarity: string;
  set_price: string;
}

interface CardImageInput {
  id: number;
  image_url: string;
  image_url_small: string | null;
  image_url_cropped: string | null;
}

interface CardInput {
  id: string;
  name: string;
  type: string;
  frameType: string;
  desc: string;

  race: string;

  atk: string | null;
  def: string | null;
  level: string | null;
  attribute: string | null;

  archetype: string | null;

  scale: string | null;

  linkval: string | null;
  linkmarkers: string[] | null;

  card_sets: CardSetInput[] | null;
  card_images: CardImageInput[] | null;
}

class CardSet {
  setName: string;
  setCode: string;
  setRarity: string;
  setPrice: string;

  constructor(input: CardSetInput) {
    this.setCode = input.set_code;
    this.setName = input.set_name;
    this.setPrice = input.set_price;
    this.setRarity = input.set_rarity;
  }
}

class CardImage {
  id: number;
  imageUrl: string;
  imageSmall: string | null;
  imageCropped: string | null;

  constructor(input: CardImageInput) {
    this.id = input.id;
    this.imageUrl = input.image_url;
    this.imageSmall = input.image_url_small;
    this.imageCropped = input.image_url_cropped;
  }
}

class Card {
  id: string;
  name: string;
  type: string;
  frameType: string;
  desc: string;

  race: string;

  atk: string;
  def: string;
  level: string;
  attribute: string;

  archetype: string;

  scale: string;

  link: string;
  linkMarkers: string[];

  cardSets: CardSet[];
  cardImages: CardImage[];

  constructor(input: CardInput) {
    this.id = input.id;
    this.name = input.name;
    this.type = input.type;
    this.frameType = input.frameType;
    this.desc = input.desc;
    this.race = input.race;

    this.atk = "";
    this.def = "";
    this.level = "";
    this.attribute = "";
    this.archetype = "";
    this.scale = "";
    this.link = "";

    if (input.atk != undefined) this.atk = `${input.atk}`;
    if (input.def != undefined) this.def = `${input.def}`;
    if (input.level != undefined) this.level = `${input.level}`;
    if (input.attribute != undefined) this.attribute = input.attribute;
    if (input.archetype != undefined) this.archetype = input.archetype;
    if (input.scale != undefined) this.scale = `${input.scale}`;
    if (input.linkval != undefined) this.link = `${input.linkval}`;

    this.linkMarkers = [];
    this.cardSets = [];
    this.cardImages = [];
    if (input.linkmarkers) this.linkMarkers = input.linkmarkers;
    if (input.card_sets != null) {
      input.card_sets.forEach((cardSet) =>
        this.cardSets.push(new CardSet(cardSet))
      );
    }
    if (input.card_images != null) {
      input.card_images.forEach((cardImage) =>
        this.cardImages.push(new CardImage(cardImage))
      );
    }
  }
}

export { Card, CardInput, CardSet, CardSetInput, CardImage, CardImageInput };
