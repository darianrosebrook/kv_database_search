import { describe, it, expect } from "vitest";
import { EntityExtractor } from "../../src/entity-extractor";

describe("EntityExtractor", () => {
  const extractor = new EntityExtractor();

  describe("extractEntities (default behavior)", () => {
    it("returns every Title Case bigram occurrence when minMentions is 1", () => {
      const text = "Yann LeCun spoke about world models. Yann LeCun continued.";
      const entities = extractor.extractEntities(text);
      const lecunMentions = entities.filter(
        (e) => e.text === "Yann LeCun" && e.type === "person",
      );
      expect(lecunMentions.length).toBe(2);
    });

    it("rejects bigrams whose words appear in the non-person blocklist", () => {
      const text = "Machine Learning is a discipline. Deep Learning too.";
      const entities = extractor.extractEntities(text);
      expect(entities.find((e) => e.text === "Machine Learning")).toBeUndefined();
      expect(entities.find((e) => e.text === "Deep Learning")).toBeUndefined();
    });
  });

  describe("extractEntities (minMentions filter)", () => {
    it("drops candidates that appear fewer than minMentions times", () => {
      const text =
        "Seminar Robots came up once. " +
        "Yann LeCun, Yann LeCun, and Yann LeCun came up three times.";
      const entities = extractor.extractEntities(text, { minMentions: 2 });
      expect(entities.find((e) => e.text === "Seminar Robots")).toBeUndefined();
      const lecun = entities.filter((e) => e.text === "Yann LeCun");
      expect(lecun.length).toBeGreaterThan(0);
    });

    it("keeps single-mention candidates when minMentions is 1", () => {
      const text = "Alice Smith spoke once.";
      const entities = extractor.extractEntities(text, { minMentions: 1 });
      expect(entities.find((e) => e.text === "Alice Smith")).toBeDefined();
    });
  });

  describe("extractEntities (dedupe)", () => {
    it("returns one entry per canonical (type, lowercased text) pair", () => {
      const text =
        "Yann LeCun. Yann LeCun. Yann LeCun.";
      const entities = extractor.extractEntities(text, {
        minMentions: 1,
        dedupe: true,
      });
      const lecun = entities.filter((e) => e.text === "Yann LeCun");
      expect(lecun.length).toBe(1);
    });

    it("composes with minMentions: drops then dedupes", () => {
      const text =
        "Seminar Robots once. Yann LeCun twice — Yann LeCun.";
      const entities = extractor.extractEntities(text, {
        minMentions: 2,
        dedupe: true,
      });
      expect(entities.find((e) => e.text === "Seminar Robots")).toBeUndefined();
      const lecun = entities.filter((e) => e.text === "Yann LeCun");
      expect(lecun.length).toBe(1);
    });
  });

  describe("expanded NON_PERSON_WORDS blocklist", () => {
    it("rejects ocr-style false positives like 'Seminar Robots' and 'Term Vision'", () => {
      const text =
        "Seminar Robots, Term Vision, Driven Al, Must Embrace, Why Al, Level Al.";
      const entities = extractor.extractEntities(text);
      expect(entities.find((e) => e.text === "Seminar Robots")).toBeUndefined();
      expect(entities.find((e) => e.text === "Term Vision")).toBeUndefined();
      expect(entities.find((e) => e.text === "Driven Al")).toBeUndefined();
      expect(entities.find((e) => e.text === "Must Embrace")).toBeUndefined();
      expect(entities.find((e) => e.text === "Why Al")).toBeUndefined();
      expect(entities.find((e) => e.text === "Level Al")).toBeUndefined();
    });

    it("rejects technical-slide section headers misread as people", () => {
      const text =
        "Training JEPA, Joint Embedding, Hierarchical Planning, Generative Prediction, " +
        "Collapse Prevention, Action Conditioned, Energy Models, Contrastive Method, " +
        "Regularized Methods, Sketched Isotropic, Gaussian Regularization, Robot Planning.";
      const entities = extractor.extractEntities(text);
      const rejects = [
        "Training JEPA",
        "Joint Embedding",
        "Hierarchical Planning",
        "Generative Prediction",
        "Collapse Prevention",
        "Action Conditioned",
        "Energy Models",
        "Contrastive Method",
        "Regularized Methods",
        "Sketched Isotropic",
        "Gaussian Regularization",
        "Robot Planning",
      ];
      for (const r of rejects) {
        expect(
          entities.find((e) => e.text === r),
          `expected ${r} to be filtered`,
        ).toBeUndefined();
      }
    });

    it("still accepts plausible real names alongside the rejected phrases", () => {
      const text =
        "Yann LeCun gave a talk. Yann LeCun discussed Hierarchical Planning.";
      const entities = extractor.extractEntities(text, {
        minMentions: 2,
        dedupe: true,
      });
      expect(entities.find((e) => e.text === "Yann LeCun")).toBeDefined();
      expect(
        entities.find((e) => e.text === "Hierarchical Planning"),
      ).toBeUndefined();
    });
  });
});
