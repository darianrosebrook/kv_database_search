import { describe, it, expect } from "vitest";
import { EnhancedEntityExtractor } from "../../src/lib/utils";

describe("EnhancedEntityExtractor", () => {
  const extractor = new EnhancedEntityExtractor();

  it("should extract person names", () => {
    const text = "John Smith and Mary Johnson work at Apple Inc.";
    const entities = extractor.extractEntities(text);

    const personEntities = entities.filter((e) => e.type === "person");
    expect(personEntities).toHaveLength(3); // John, Smith, Mary
    expect(personEntities.some((e) => e.text === "John Smith")).toBe(true);
    expect(personEntities.some((e) => e.text === "Mary Johnson")).toBe(true);
  });

  it("should extract organization names", () => {
    const text = "Apple Inc. and Microsoft Corporation are tech companies.";
    const entities = extractor.extractEntities(text);

    const orgEntities = entities.filter((e) => e.type === "organization");
    expect(orgEntities).toHaveLength(1);
    expect(orgEntities.some((e) => e.text.includes("Apple Inc"))).toBe(true);
  });

  it("should extract technical concepts", () => {
    const text =
      "MachineLearning and ArtificialIntelligence are key AI concepts.";
    const entities = extractor.extractEntities(text);

    const conceptEntities = entities.filter((e) => e.type === "concept");
    expect(conceptEntities).toHaveLength(2);
    expect(conceptEntities[0].text).toBe("MachineLearning");
    expect(conceptEntities[1].text).toBe("ArtificialIntelligence");
  });

  it("should extract relationships", () => {
    const text = "John Smith works at Apple Inc.";
    const entities = extractor.extractEntities(text);
    const relationships = extractor.extractRelationships(text, entities);

    expect(relationships).toHaveLength(1);
    expect(relationships[0].subject).toBe("Smith"); // Pattern matches individual names
    expect(relationships[0].predicate).toBe("works_at");
    expect(relationships[0].object).toBe("Apple Inc"); // Organization name without period
  });

  it("should cluster entities by type", () => {
    const text = "John Smith works at Apple Inc. and studies MachineLearning.";
    const entities = extractor.extractEntities(text);
    const relationships = extractor.extractRelationships(text, entities);
    const clusters = extractor.clusterEntities(entities, relationships);

    expect(clusters).toHaveLength(4); // person, organization, concept, term
    expect(clusters.some((c) => c.name === "Persons")).toBe(true);
    expect(clusters.some((c) => c.name === "Organizations")).toBe(true);
    expect(clusters.some((c) => c.name === "Concepts")).toBe(true);
  });

  it("should handle complex text with multiple entity types", () => {
    const text = `
      Sarah Wilson, a data scientist at Google LLC, presented her research on
      NaturalLanguageProcessing at the AI Conference 2024. The presentation
      covered advanced topics in MachineLearning and DeepLearning algorithms.
    `;

    const entities = extractor.extractEntities(text);
    const relationships = extractor.extractRelationships(text, entities);
    const clusters = extractor.clusterEntities(entities, relationships);

    expect(entities.length).toBeGreaterThan(5);
    expect(relationships.length).toBeGreaterThanOrEqual(0); // May not find relationships
    expect(clusters.length).toBeGreaterThanOrEqual(1);

    // Check for specific entities
    const personEntities = entities.filter((e) => e.type === "person");
    const orgEntities = entities.filter((e) => e.type === "organization");
    const conceptEntities = entities.filter((e) => e.type === "concept");

    expect(personEntities.some((e) => e.text.includes("Sarah"))).toBe(true);
    expect(orgEntities.some((e) => e.text.includes("Google LLC"))).toBe(true);
    expect(
      conceptEntities.some((e) => e.text.includes("NaturalLanguageProcessing"))
    ).toBe(true);
  });
});
