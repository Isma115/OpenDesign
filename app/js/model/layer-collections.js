// Organización del panel: nunca modifica elementos ni su orden de dibujo.
export function createLayerCollection(doc, name = 'Nueva agrupación') {
  const collection = { id: crypto.randomUUID(), name, elementIds: [], collapsed: false };
  (doc.layerCollections ||= []).push(collection);
  return collection;
}

export function moveLayerToCollection(doc, elementId, collectionId = null) {
  if (!doc.elements.some(el => el.id === elementId)) return false;
  const collections = doc.layerCollections || [];
  const target = collections.find(collection => collection.id === collectionId);
  if (collectionId !== null && !target) return false;
  for (const collection of collections) {
    collection.elementIds = collection.elementIds.filter(id => id !== elementId);
  }
  if (target) {
    target.elementIds.push(elementId);
    target.collapsed = false;
  }
  return true;
}
