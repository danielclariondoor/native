import { input as getInput, inputName } from '../lib/components'
import FormSchemaInput from './FormSchemaInput'
import FormSchemaWrappingInput from './FormSchemaWrappingInput'
import FormSchemaFieldCheckboxItem from './FormSchemaFieldCheckboxItem'
import FormSchemaFieldSelectOption from './FormSchemaFieldSelectOption'

const FormSchemaField = {
  functional: true,
  render (createElement, context) {
    const vm = context.props.vm
    const inputWrappingClass = context.props.inputWrappingClass
    const field = context.props.field
    const attrs = field.attrs

    const input = getInput({ vm, field })
    const element = input.element
    const children = []

    switch (attrs.type) {
      case 'textarea':
        if (element.option.native) {
          delete input.attrs.type
          delete input.attrs.value

          input.domProps.innerHTML = vm.data[attrs.name]
        }
        break

      case 'radio':
        if (field.hasOwnProperty('items')) {
          field.items.forEach((item) => {
            children.push(createElement(FormSchemaFieldCheckboxItem, {
              props: { vm, field, item, disableWrappingLabel: true }
            }))
          })

          return createElement(FormSchemaInput, {
            props: { vm, field, input, element }
          }, children)
        }
        break

      case 'checkbox':
        if (field.hasOwnProperty('items')) {
          field.items.forEach((item, i) => {
            children.push(createElement(FormSchemaFieldCheckboxItem, {
              props: {
                vm,
                item,
                ref: inputName(field, i),
                field: { ...field, label: item.label },
                checked: vm.data[field.attrs.name].includes(item.value)
              }
            }))
          })

          return createElement(FormSchemaInput, {
            props: { vm, field, input, element }
          }, children)
        }
        break

      case 'select':
        const items = [ ...field.items ]

        if (!attrs.required) {
          items.unshift({ label: null, value: '' })
        }

        if (input.attrs) {
          delete input.attrs.type
          delete input.attrs.value
          delete input.attrs.native
        }

        items.forEach((option) => {
          children.push(createElement(FormSchemaFieldSelectOption, {
            props: { vm, field, option, disableWrappingLabel: true }
          }))
        })
        break

      case 'fieldset':
        field.items.forEach((item) => {
          children.push(createElement(FormSchemaField, {
            props: { vm, inputWrappingClass, field: item }
          }))
        })
        return createElement('fieldset', {
          props: { vm }
        }, children)
    }

    return createElement(FormSchemaWrappingInput, {
      props: { vm, field, inputWrappingClass }
    }, [
      createElement(FormSchemaInput, {
        props: { vm, field, input, element }
      }, children)
    ])
  }
}

export default FormSchemaField
