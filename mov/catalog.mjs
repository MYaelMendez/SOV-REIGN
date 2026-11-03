/** Trusted bundled synthetic fixture. This module exports JSON, never a plugin binding. */
export const CATALOG_JSON = JSON.stringify({
  schema: 'open-sovereign.viewport-registry.v1', version: '0.1.0', id: 'mov.examples',
  sourceRevision: 'a6f8e76b152128b979ac3a1af2279efe44dfccad',
  viewports: [
    { id:'garden', title:'Garden', symbol:'\ud83c\udf3f', summary:'Observe a shared garden. Collect public notes and questions before deciding what to grow.', source:{url:'https://example.invalid/molt/garden',revision:'garden-v1',kind:'synthetic'}, classification:'public',capabilities:['viewport.read'],rendering:'text' },
    { id:'sanctuary', title:'Sanctuary', symbol:'\ud83e\udda9', summary:'Explore a conservation learning space. Notice what is known, what is uncertain, and what deserves care.', source:{url:'https://example.invalid/molt/sanctuary',revision:'sanctuary-v1',kind:'synthetic'}, classification:'public',capabilities:['viewport.read'],rendering:'text' },
    { id:'mobility', title:'Mobility', symbol:'\ud83c\udfce\ufe0f', summary:'Compare a sample route and its questions. No vehicle control, location tracking, or live traffic data.', source:{url:'https://example.invalid/molt/mobility',revision:'mobility-v1',kind:'synthetic'}, classification:'public',capabilities:['viewport.read'],rendering:'text' },
    { id:'learning', title:'Learning', symbol:'\ud83d\udcd6', summary:'Turn an observation into a small lesson. Build understanding, review the evidence, and teach what you learned.', source:{url:'https://example.invalid/molt/learning',revision:'learning-v1',kind:'synthetic'}, classification:'public',capabilities:['viewport.read'],rendering:'text' }
  ]
});
