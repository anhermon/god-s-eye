/**
 * JanusGraph schema definition for GDELT GKG knowledge graph.
 *
 * Vertex labels: article, person, organization, location, theme
 * Edge labels: mentions_person, mentions_org, located_in, has_theme, co_occurs_with
 */

/** Schema creation scripts for JanusGraph (Groovy via Gremlin Server) */
export const SCHEMA_SCRIPTS = {
  /** Create all property keys */
  propertyKeys: `
    mgmt = graph.openManagement()

    // Article properties
    if (!mgmt.containsPropertyKey('gkgRecordId'))
      mgmt.makePropertyKey('gkgRecordId').dataType(String.class).cardinality(org.janusgraph.core.Cardinality.SINGLE).make()
    if (!mgmt.containsPropertyKey('date'))
      mgmt.makePropertyKey('date').dataType(Long.class).cardinality(org.janusgraph.core.Cardinality.SINGLE).make()
    if (!mgmt.containsPropertyKey('sourceCommonName'))
      mgmt.makePropertyKey('sourceCommonName').dataType(String.class).cardinality(org.janusgraph.core.Cardinality.SINGLE).make()
    if (!mgmt.containsPropertyKey('documentUrl'))
      mgmt.makePropertyKey('documentUrl').dataType(String.class).cardinality(org.janusgraph.core.Cardinality.SINGLE).make()
    if (!mgmt.containsPropertyKey('tone'))
      mgmt.makePropertyKey('tone').dataType(Float.class).cardinality(org.janusgraph.core.Cardinality.SINGLE).make()
    if (!mgmt.containsPropertyKey('sharingImage'))
      mgmt.makePropertyKey('sharingImage').dataType(String.class).cardinality(org.janusgraph.core.Cardinality.SINGLE).make()
    if (!mgmt.containsPropertyKey('title'))
      mgmt.makePropertyKey('title').dataType(String.class).cardinality(org.janusgraph.core.Cardinality.SINGLE).make()

    // Entity properties
    if (!mgmt.containsPropertyKey('name'))
      mgmt.makePropertyKey('name').dataType(String.class).cardinality(org.janusgraph.core.Cardinality.SINGLE).make()

    // Location properties
    if (!mgmt.containsPropertyKey('lat'))
      mgmt.makePropertyKey('lat').dataType(Float.class).cardinality(org.janusgraph.core.Cardinality.SINGLE).make()
    if (!mgmt.containsPropertyKey('lon'))
      mgmt.makePropertyKey('lon').dataType(Float.class).cardinality(org.janusgraph.core.Cardinality.SINGLE).make()
    if (!mgmt.containsPropertyKey('countryCode'))
      mgmt.makePropertyKey('countryCode').dataType(String.class).cardinality(org.janusgraph.core.Cardinality.SINGLE).make()
    if (!mgmt.containsPropertyKey('adm1Code'))
      mgmt.makePropertyKey('adm1Code').dataType(String.class).cardinality(org.janusgraph.core.Cardinality.SINGLE).make()

    // Edge properties
    if (!mgmt.containsPropertyKey('offset'))
      mgmt.makePropertyKey('offset').dataType(Integer.class).cardinality(org.janusgraph.core.Cardinality.SINGLE).make()
    if (!mgmt.containsPropertyKey('articleCount'))
      mgmt.makePropertyKey('articleCount').dataType(Integer.class).cardinality(org.janusgraph.core.Cardinality.SINGLE).make()
    if (!mgmt.containsPropertyKey('lastSeen'))
      mgmt.makePropertyKey('lastSeen').dataType(Long.class).cardinality(org.janusgraph.core.Cardinality.SINGLE).make()

    mgmt.commit()
    'Property keys created'
  `,

  /** Create all vertex labels */
  vertexLabels: `
    mgmt = graph.openManagement()

    if (!mgmt.containsVertexLabel('article'))
      mgmt.makeVertexLabel('article').make()
    if (!mgmt.containsVertexLabel('person'))
      mgmt.makeVertexLabel('person').make()
    if (!mgmt.containsVertexLabel('organization'))
      mgmt.makeVertexLabel('organization').make()
    if (!mgmt.containsVertexLabel('location'))
      mgmt.makeVertexLabel('location').make()
    if (!mgmt.containsVertexLabel('theme'))
      mgmt.makeVertexLabel('theme').make()

    mgmt.commit()
    'Vertex labels created'
  `,

  /** Create all edge labels */
  edgeLabels: `
    mgmt = graph.openManagement()

    if (!mgmt.containsEdgeLabel('mentions_person'))
      mgmt.makeEdgeLabel('mentions_person').multiplicity(MULTI).make()
    if (!mgmt.containsEdgeLabel('mentions_org'))
      mgmt.makeEdgeLabel('mentions_org').multiplicity(MULTI).make()
    if (!mgmt.containsEdgeLabel('located_in'))
      mgmt.makeEdgeLabel('located_in').multiplicity(MULTI).make()
    if (!mgmt.containsEdgeLabel('has_theme'))
      mgmt.makeEdgeLabel('has_theme').multiplicity(MULTI).make()
    if (!mgmt.containsEdgeLabel('co_occurs_with'))
      mgmt.makeEdgeLabel('co_occurs_with').multiplicity(MULTI).make()

    mgmt.commit()
    'Edge labels created'
  `,

  /** Create composite indexes for efficient lookups */
  indexes: `
    mgmt = graph.openManagement()

    // Article lookup by record ID (unique)
    if (!mgmt.containsGraphIndex('byGkgRecordId')) {
      gkgId = mgmt.getPropertyKey('gkgRecordId')
      mgmt.buildIndex('byGkgRecordId', Vertex.class).addKey(gkgId).unique().buildCompositeIndex()
    }

    // Article lookup by date (primary timeline query path)
    if (!mgmt.containsGraphIndex('byDate')) {
      date = mgmt.getPropertyKey('date')
      mgmt.buildIndex('byDate', Vertex.class).addKey(date).buildCompositeIndex()
    }

    // Entity name lookups
    if (!mgmt.containsGraphIndex('byName')) {
      name = mgmt.getPropertyKey('name')
      mgmt.buildIndex('byName', Vertex.class).addKey(name).buildCompositeIndex()
    }

    mgmt.commit()

    // Indexes register asynchronously — they'll be available within seconds
    'Indexes created'
  `,
};
