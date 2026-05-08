/**
 * Curated image assets for Dinemate.
 *
 * Food photography sourced from Unsplash (free for commercial use under the
 * Unsplash License). UNC landmarks sourced from Wikimedia Commons under
 * Creative Commons licenses with credit retained in the colophon.
 */

export interface RemoteImage {
  src: string;
  alt: string;
  credit: string;
  creditUrl: string;
}

const unsplash = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

// ---------- Landing ----------

export const HERO_FOOD: RemoteImage = {
  src: unsplash("photo-1490645935967-10de6ba17061", 1600),
  alt: "A fresh bowl with avocado, soft-boiled egg, watermelon radish and grains on a rustic wooden surface.",
  credit: "Brooke Lark / Unsplash",
  creditUrl: "https://unsplash.com/photos/08bOYnH_r_E",
};

export const STEP_TELL_US: RemoteImage = {
  src: unsplash("photo-1466637574441-749b8f19452f", 900),
  alt: "Wooden cutting board with avocado, mushrooms, cherry tomatoes, eggs and herbs.",
  credit: "Maarten van den Heuvel / Unsplash",
  creditUrl: "https://unsplash.com/photos/EzH46XCDQRY",
};

export const STEP_MATH: RemoteImage = {
  src: unsplash("photo-1546069901-ba9599a7e63c", 900),
  alt: "Colorful balanced bowl with tofu, edamame, corn, tomatoes and greens — top-down view.",
  credit: "Anh Nguyen / Unsplash",
  creditUrl: "https://unsplash.com/photos/fDb-DyBMlYY",
};

export const STEP_EAT: RemoteImage = {
  src: unsplash("photo-1504674900247-0877df9cc836", 900),
  alt: "Three plates of food on a wooden table — a magazine-style spread.",
  credit: "Kristiana Pinne / Unsplash",
  creditUrl: "https://unsplash.com/photos/8mbzTfoaY3w",
};

export const UNC_OLD_WELL: RemoteImage = {
  src: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Old_Well_and_McCorkle_Place_2005.jpg/1280px-Old_Well_and_McCorkle_Place_2005.jpg",
  alt: "The Old Well at UNC Chapel Hill, surrounded by spring azalea blooms.",
  credit: "Wikimedia Commons (CC BY-SA)",
  creditUrl:
    "https://commons.wikimedia.org/wiki/File:Old_Well_and_McCorkle_Place_2005.jpg",
};

// ---------- Wizard (one image per step, none repeated from landing) ----------

export const WIZARD_VITALS: RemoteImage = {
  src: unsplash("photo-1456324504439-367cee3b3c32", 1100),
  alt: "Hands writing in a journal next to a cup of coffee and a croissant — top-down.",
  credit: "Hannah Olinger / Unsplash",
  creditUrl: "https://unsplash.com/photos/8eSrC43qdro",
};

export const WIZARD_EFFORT: RemoteImage = {
  src: unsplash("photo-1486218119243-13883505764c", 1100),
  alt: "A lone runner on a country road under a wide blue sky.",
  credit: "Tim Foster / Unsplash",
  creditUrl: "https://unsplash.com/photos/QtwSC2D52F4",
};

export const WIZARD_GOAL: RemoteImage = {
  src: unsplash("photo-1467003909585-2f8a72700288", 1100),
  alt: "An elegantly plated piece of salmon with vegetables and wine glasses in soft light.",
  credit: "Jay Wennington / Unsplash",
  creditUrl: "https://unsplash.com/photos/N_Y88TWmGwA",
};

export const WIZARD_DIET: RemoteImage = {
  src: unsplash("photo-1488459716781-31db52582fe9", 1100),
  alt: "A vibrant farmers' market display — fruits, vegetables and herbs, packed with color.",
  credit: "Peter Wendt / Unsplash",
  creditUrl: "https://unsplash.com/photos/UpsB7yj4iRE",
};

// ---------- Plan View ----------

export const PLAN_COVER: RemoteImage = {
  src: unsplash("photo-1493770348161-369560ae357d", 1800),
  alt: "A bright breakfast spread of bowls, waffles, fresh berries and tea on a marble surface.",
  credit: "Brooke Lark / Unsplash",
  creditUrl: "https://unsplash.com/photos/W9OKrxBqiZA",
};
