function value(record, key) {
  return record?.get?.(key)
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim() !== ''
}

function generatedId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`
}

function kebab(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function cleanLocalized(data, key, label) {
  const field = value(data, key)
  if (field == null) return data
  const pt = value(field, 'pt')
  const en = value(field, 'en')
  if (!nonEmpty(pt) && !nonEmpty(en)) return data.delete(key)
  if (!nonEmpty(pt) || !nonEmpty(en))
    throw new Error(`${label} precisa estar completo em PT-BR e inglês.`)
  return data
}

function cleanContext(data) {
  const context = value(data, 'context')
  if (context == null) return data
  const role = value(context, 'role')
  const fields = [value(context, 'clientOrBrand'), value(role, 'pt'), value(role, 'en')]
  if (fields.every((field) => !nonEmpty(field))) return data.delete('context')
  if (fields.some((field) => !nonEmpty(field))) {
    throw new Error(
      'Contexto do projeto precisa incluir cliente ou marca e função nos dois idiomas.',
    )
  }
  return data
}

function normalizeFocalPoint(item) {
  const focalPoint = value(item, 'focalPoint')
  if (focalPoint == null) return item
  const x = value(focalPoint, 'x')
  const y = value(focalPoint, 'y')
  if (x == null && y == null) return item.delete('focalPoint')
  if (typeof x !== 'number' || typeof y !== 'number') {
    throw new Error('O ponto focal precisa ter valores horizontal e vertical.')
  }
  return item
}

function normalizeProject(data) {
  const title = value(data, 'title')
  const currentSlug = value(data, 'slug')
  const slug = nonEmpty(currentSlug) ? currentSlug : kebab(value(title, 'pt'))
  if (!nonEmpty(slug)) throw new Error('Informe o título em PT-BR para gerar o slug.')

  const media = value(data, 'media')
  const selectedCoverIds = []
  const normalizedMedia = media?.map((item) => {
    const type = value(item, 'type')
    const withId = nonEmpty(value(item, 'id')) ? item : item.set('id', generatedId('media'))
    if (type === 'image' && value(item, 'isCover')) selectedCoverIds.push(value(withId, 'id'))
    return (type === 'image' ? normalizeFocalPoint(withId) : withId).delete('isCover')
  })

  if (selectedCoverIds.length > 1) throw new Error('Selecione apenas uma imagem de capa.')
  const coverMediaId = selectedCoverIds[0] || value(data, 'coverMediaId')
  const cover = normalizedMedia?.find(
    (item) => value(item, 'id') === coverMediaId && value(item, 'type') === 'image',
  )
  if (cover == null) throw new Error('Selecione uma imagem da galeria como capa do projeto.')

  const rank = value(data, 'rank')
  let normalized = data
    .set('id', nonEmpty(value(data, 'id')) ? value(data, 'id') : generatedId('project'))
    .set('slug', slug)
    .set('rank', Number.isInteger(rank) && rank >= 0 ? rank : Date.now())
    .set('media', normalizedMedia)
    .set('coverMediaId', coverMediaId)
  normalized = cleanLocalized(normalized, 'description', 'A narrativa do projeto')
  return cleanContext(normalized)
}

function normalizeCatalog(data) {
  const disciplines = value(data, 'disciplines')
  return data.set(
    'disciplines',
    disciplines?.map((discipline, index) =>
      discipline
        .set(
          'id',
          nonEmpty(value(discipline, 'id')) ? value(discipline, 'id') : generatedId('discipline'),
        )
        .set('rank', index + 1),
    ),
  )
}

CMS.registerEventListener({
  name: 'preSave',
  handler: ({ entry }) => {
    const data = entry.get('data')
    if (data.has('media')) return normalizeProject(data)
    if (data.has('disciplines')) return normalizeCatalog(data)
    return data
  },
})
