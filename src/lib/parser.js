'use strict'

/* eslint-disable no-labels */

const ARRAY_KEYWORDS = ['anyOf', 'oneOf', 'enum', 'items']

export function setCommonFields (schema, field) {
  field.attrs.value = field.attrs.hasOwnProperty('value')
    ? field.attrs.value
    : schema.default || ''

  field.schemaType = schema.type
  field.label = schema.title || ''
  field.description = schema.description || ''
  field.attrs.required = schema.required || false
  field.attrs.disabled = schema.disabled || false
}

export function loadFields (schema, fields, name = null) {
  if (!schema || schema.visible === false) {
    return
  }

  switch (schema.type) {
    case 'object':
      for (let key in schema.properties) {
        if (schema.required) {
          for (let field of schema.required) {
            if (schema.properties.hasOwnProperty(field)) {
              schema.properties[field].required = true
            }
          }
        }

        loadFields(schema.properties[key], fields, key)
      }
      break

    case 'boolean':
      fields.push(parseBoolean(schema, name))
      break

    case 'array':
      fields.push(parseArray(schema, name))
      break

    case 'integer':
    case 'number':
    case 'string':
      for (let keyword of ARRAY_KEYWORDS) {
        if (schema.hasOwnProperty(keyword)) {
          schema.items = {
            type: schema.type,
            enum: schema[keyword]
          }
          fields.push(parseArray(schema, name))

          return
        }
      }
      fields.push(parseString(schema, name))
      break
  }
}

export function parseBoolean (schema, name = null) {
  const field = {
    attrs: schema.attrs || {}
  }

  setCommonFields(schema, field)

  if (!field.attrs.type) {
    field.attrs.type = 'checkbox'
  }

  field.attrs.checked = schema.checked || false

  if (name) {
    field.attrs.name = name
  }

  return field
}

export function parseString (schema, name = null) {
  const field = {
    attrs: schema.attrs || {}
  }

  if (schema.pattern) {
    field.attrs.pattern = schema.pattern
  }

  if (schema.format) {
    switch (schema.format) {
      case 'email':
        if (!field.attrs.type) {
          field.attrs.type = 'email'
        }
        break

      case 'uri':
        if (!field.attrs.type) {
          field.attrs.type = 'url'
        }
        break
    }
  }

  if (!field.attrs.type) {
    switch (schema.type) {
      case 'number':
      case 'integer':
        field.attrs.type = 'number'
        break
      default:
        field.attrs.type = 'text'
    }
  }

  setCommonFields(schema, field)

  if (name) {
    field.attrs.name = name
  }

  if (schema.minLength) {
    field.attrs.minlength = schema.minLength
  }

  if (schema.maxLength) {
    field.attrs.maxlength = schema.maxLength
  }

  return field
}

export function parseItems (items) {
  return items.map((item) => {
    if (typeof item !== 'object') {
      return { value: item, label: item }
    }

    return item
  })
}

export const setItemName = (name) => (item) => {
  if (!item.name) {
    item.name = name ? `${name}-` : ''
    item.name += item.label.replace(/\s+/g, '-')
  }

  return item
}

export function arrayValues (field) {
  return field.items.map((item) => item.checked ? item.value : undefined)
}

export function singleValue (field) {
  const item = field.items.reverse().find((item) => item.checked || item.selected)

  return item ? item.value : ''
}

export function parseArray (schema, name = null) {
  const field = {
    attrs: schema.attrs || {}
  }

  setCommonFields(schema, field)

  if (name) {
    field.attrs.name = name
  }

  field.items = []
  field.minItems = parseInt(schema.minItems) || 1
  field.maxItems = parseInt(schema.maxItems) || 1000

  loop:
  for (let keyword of ARRAY_KEYWORDS) {
    if (schema.hasOwnProperty(keyword)) {
      switch (keyword) {
        case 'enum':
          if (!field.attrs.type) {
            field.attrs.type = 'select'
          }

          field.items = parseItems(schema[keyword])
          break loop

        case 'oneOf':
          field.attrs.type = 'radio'
          field.attrs.value = field.attrs.value || ''
          field.items = parseItems(schema[keyword]).map(setItemName(name))

          if (field.attrs.value.length === 0) {
            field.attrs.value = singleValue(field)
          }
          break loop

        case 'anyOf':
          field.attrs.type = 'checkbox'
          field.attrs.value = field.attrs.value || []
          field.items = parseItems(schema[keyword]).map(setItemName(name))

          if (field.attrs.value.length === 0) {
            field.attrs.value = arrayValues(field)
          }
          break loop

        case 'items':
          loadFields(schema.items, field.items, name)
          field.attrs.type = 'fieldset'
          field.attrs.value = field.attrs.value || []
          if (!field.title) {
            field.title = schema.title
          }
          break loop
      }
    }
  }

  if (!field.attrs.type) {
    field.attrs.type = 'text'
  } else if (field.attrs.type === 'select') {
    field.attrs.multiple = field.minItems > 1
    field.attrs.value = field.attrs.value || field.attrs.multiple ? [] : ''

    if (field.attrs.value.length === 0) {
      field.attrs.value = field.attrs.multiple
        ? arrayValues(field)
        : singleValue(field)
    }
  }

  return field
}
