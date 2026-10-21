import {
  extractCities, extractNumbers, extractOrdinals, normalize, overlapScore, properNouns,
  splitSentences, stem, tokenize,
} from "@/lib/text";

describe("text utils", () => {
  it("normalizes case, accents and curly quotes", () => {
    expect(normalize("Café’s BEST")).toBe("cafe's best");
  });

  it("tokenizes into stemmed content tokens without stopwords", () => {
    expect(tokenize("Congrats on opening your third café in Berkeley.")).toEqual(["open", "ord:3", "location", "berkeley"]);
  });

  it("stems plurals and verb forms to the same root", () => {
    expect(stem("opened")).toBe(stem("opening"));
    expect(stem("pastries")).toBe(stem("pastry"));
    expect(stem("moved")).toBe(stem("move"));
    expect(stem("weddings")).toBe(stem("wedding"));
  });

  it("maps café, shop, spot and location to one synonym", () => {
    expect(tokenize("café shop spot locations")).toEqual(["location"]);
  });

  it("parses digits, decimals and word numbers", () => {
    expect(extractNumbers("4.6 stars from 128 reviews").map((n) => n.value)).toEqual([4.6, 128]);
    expect(extractNumbers("across two floors").map((n) => n.value)).toEqual([2]);
    expect(extractNumbers("third café")).toEqual([]);
  });

  it("parses ordinals as words and suffixes", () => {
    expect(extractOrdinals("your third café")).toEqual([{ value: 3, raw: "third" }]);
    expect(extractOrdinals("the 2nd location").map((o) => o.value)).toEqual([2]);
  });

  it("finds Bay Area cities and ignores others", () => {
    expect(extractCities("a spot in Alameda, not Berkeley or Paris")).toEqual(["alameda", "berkeley"]);
    expect(extractCities("San Francisco and Walnut Creek")).toEqual(["san francisco", "walnut creek"]);
  });

  it("finds mid-sentence proper nouns but not sentence starts, months or cities", () => {
    expect(properNouns("Saw that Harborview is hosting the Uptown Art Walk on Nov 7 in Oakland.")).toEqual(["harborview", "uptown", "art", "walk"]);
    expect(properNouns("I noticed the menu.")).toEqual([]);
  });

  it("scores token overlap as the share of claim tokens found in evidence", () => {
    expect(overlapScore(["a", "b", "c", "d"], ["a", "b", "x"])).toBe(0.5);
    expect(overlapScore([], ["a"])).toBe(0);
  });

  it("splits sentences with spans that map back into the source", () => {
    const text = "Hi Dana,\n\nCongrats on 4.6 stars. We bake bread! Want some?";
    const s = splitSentences(text);
    expect(s.map((x) => x.text)).toEqual(["Hi Dana,", "Congrats on 4.6 stars.", "We bake bread!", "Want some?"]);
    for (const x of s) expect(text.slice(x.start, x.end)).toBe(x.text);
  });
});
