import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import JsonDiffViewer from '../JsonDiffViewer.vue'

describe('JsonDiffViewer', () => {
  const originalContent = {
    name: 'John Doe',
    age: 30,
    email: 'john@example.com',
    skills: ['JavaScript', 'Vue']
  }

  const modifiedContent = {
    name: 'John Doe',
    age: 31,
    email: 'john.doe@example.com',
    skills: ['JavaScript', 'Vue', 'TypeScript'],
    location: 'New York'
  }

  it('renders diff viewer with original and modified content', () => {
    const wrapper = mount(JsonDiffViewer, {
      props: {
        originalContent,
        modifiedContent
      }
    })

    expect(wrapper.find('.json-diff-viewer').exists()).toBe(true)
    expect(wrapper.find('.diff-header').exists()).toBe(true)
    expect(wrapper.find('.side-by-side-view').exists()).toBe(true)
  })

  it('toggles between side-by-side and unified view modes', async () => {
    const wrapper = mount(JsonDiffViewer, {
      props: {
        originalContent,
        modifiedContent
      }
    })

    // Initially should be in side-by-side mode
    expect(wrapper.find('.side-by-side-view').exists()).toBe(true)
    expect(wrapper.find('.unified-view').exists()).toBe(false)

    // Click toggle button
    await wrapper.find('.action-btn').trigger('click')

    // Should switch to unified view
    expect(wrapper.find('.side-by-side-view').exists()).toBe(false)
    expect(wrapper.find('.unified-view').exists()).toBe(true)
  })

  it('handles string JSON content', () => {
    const wrapper = mount(JsonDiffViewer, {
      props: {
        originalContent: JSON.stringify(originalContent, null, 2),
        modifiedContent: JSON.stringify(modifiedContent, null, 2)
      }
    })

    expect(wrapper.find('.json-diff-viewer').exists()).toBe(true)
    expect(wrapper.find('.diff-content').exists()).toBe(true)
  })

  it('handles invalid JSON gracefully', () => {
    const wrapper = mount(JsonDiffViewer, {
      props: {
        originalContent: 'invalid json',
        modifiedContent: modifiedContent
      }
    })

    expect(wrapper.find('.json-diff-viewer').exists()).toBe(true)
    // Should still render without crashing
  })
})