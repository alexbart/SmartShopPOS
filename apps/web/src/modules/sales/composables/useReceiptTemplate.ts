import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { apiClient } from '@/shared/lib/api-client';
import type {
  ReceiptTemplate,
  ReceiptTemplateInput,
  ReceiptSectionConfig,
  ReceiptStyleConfig,
} from '@/modules/sales/composables/receipt-template';
import { DEFAULT_SECTIONS, DEFAULT_STYLES } from '@/modules/sales/composables/receipt-template';

export interface ReceiptTemplateState {
  templates: ReceiptTemplate[];
  currentTemplate: ReceiptTemplate | null;
  defaultTemplate: ReceiptTemplate | null;
  defaultLoaded: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

// The organization is derived from the request context on the server, so no
// organization id is ever sent from the client.
export const useReceiptTemplateStore = defineStore('receipt-template', () => {
  const state = ref<ReceiptTemplateState>({
    templates: [],
    currentTemplate: null,
    defaultTemplate: null,
    defaultLoaded: false,
    loading: false,
    saving: false,
    error: null,
  });

  const fallbackTemplate = computed(() => state.value.templates.find((t) => t.isDefault) || null);

  const templateNames = computed(() => state.value.templates.map((t) => t.name));

  function describeError(err: unknown, fallback: string): string {
    const response = (err as { response?: { data?: { message?: string } } })?.response;
    return response?.data?.message || fallback;
  }

  async function loadTemplates(): Promise<void> {
    if (state.value.loading) return;
    state.value.loading = true;
    state.value.error = null;

    try {
      const response = await apiClient.get('/receipt-templates');
      state.value.templates = (response.data.data || []) as ReceiptTemplate[];

      if (!state.value.currentTemplate && state.value.templates.length > 0) {
        state.value.currentTemplate = fallbackTemplate.value || state.value.templates[0];
      }
    } catch (err) {
      state.value.error = describeError(err, 'Failed to load receipt templates.');
    } finally {
      state.value.loading = false;
    }
  }

  /**
   * Loads the organization's default template once per session so printing
   * never waits on the network mid-transaction.
   */
  async function ensureDefaultLoaded(force = false): Promise<ReceiptTemplate | null> {
    if (state.value.defaultLoaded && !force) return state.value.defaultTemplate;

    try {
      const response = await apiClient.get('/receipt-templates/default');
      state.value.defaultTemplate = (response.data.data as ReceiptTemplate | null) ?? null;
    } catch {
      // A missing default is a normal state, not an error: the receipt falls
      // back to built-in layout defaults.
      state.value.defaultTemplate = null;
    } finally {
      state.value.defaultLoaded = true;
    }

    return state.value.defaultTemplate;
  }

  async function loadTemplate(id: string): Promise<ReceiptTemplate | null> {
    try {
      const response = await apiClient.get(`/receipt-templates/${id}`);
      const template = response.data.data as ReceiptTemplate;
      const index = state.value.templates.findIndex((t) => t.id === id);
      if (index >= 0) {
        state.value.templates[index] = template;
      } else {
        state.value.templates.push(template);
      }
      state.value.currentTemplate = template;
      return template;
    } catch (err) {
      state.value.error = describeError(err, 'Failed to load the template.');
      return null;
    }
  }

  async function createTemplate(input: ReceiptTemplateInput): Promise<ReceiptTemplate | null> {
    state.value.saving = true;
    state.value.error = null;

    try {
      const response = await apiClient.post('/receipt-templates', input);
      const template = response.data.data as ReceiptTemplate;

      if (template.isDefault) {
        state.value.templates.forEach((t) => {
          t.isDefault = false;
        });
        state.value.defaultTemplate = template;
        state.value.defaultLoaded = true;
      }

      state.value.templates.push(template);
      state.value.currentTemplate = template;
      return template;
    } catch (err) {
      state.value.error = describeError(err, 'Failed to create the template.');
      return null;
    } finally {
      state.value.saving = false;
    }
  }

  async function updateTemplate(
    id: string,
    input: Partial<ReceiptTemplateInput>,
  ): Promise<ReceiptTemplate | null> {
    state.value.saving = true;
    state.value.error = null;

    try {
      const response = await apiClient.patch(`/receipt-templates/${id}`, input);
      const template = response.data.data as ReceiptTemplate;

      const index = state.value.templates.findIndex((t) => t.id === id);
      if (index >= 0) {
        state.value.templates[index] = template;
      }
      if (state.value.currentTemplate?.id === id) {
        state.value.currentTemplate = template;
      }
      if (template.isDefault) {
        state.value.defaultTemplate = template;
        state.value.defaultLoaded = true;
      }
      return template;
    } catch (err) {
      state.value.error = describeError(err, 'Failed to update the template.');
      return null;
    } finally {
      state.value.saving = false;
    }
  }

  async function deleteTemplate(id: string): Promise<boolean> {
    state.value.error = null;

    try {
      await apiClient.delete(`/receipt-templates/${id}`);
      state.value.templates = state.value.templates.filter((t) => t.id !== id);
      if (state.value.currentTemplate?.id === id) {
        state.value.currentTemplate = state.value.templates[0] || null;
      }
      if (state.value.defaultTemplate?.id === id) {
        state.value.defaultTemplate = null;
        state.value.defaultLoaded = false;
      }
      return true;
    } catch (err) {
      state.value.error = describeError(err, 'Failed to delete the template.');
      return false;
    }
  }

  async function setDefaultTemplate(id: string): Promise<boolean> {
    state.value.error = null;

    try {
      const response = await apiClient.patch(`/receipt-templates/${id}/default`);
      const template = response.data.data as ReceiptTemplate;
      state.value.templates.forEach((t) => {
        t.isDefault = t.id === id;
      });
      state.value.defaultTemplate = template;
      state.value.defaultLoaded = true;
      return true;
    } catch (err) {
      state.value.error = describeError(err, 'Failed to set the default template.');
      return false;
    }
  }

  function selectTemplate(template: ReceiptTemplate | null): void {
    state.value.currentTemplate = template;
  }

  function getMergedSections(template: ReceiptTemplate | null): ReceiptSectionConfig {
    if (!template) return DEFAULT_SECTIONS;
    return { ...DEFAULT_SECTIONS, ...template.sections };
  }

  function getMergedStyles(template: ReceiptTemplate | null): ReceiptStyleConfig {
    if (!template) return DEFAULT_STYLES;
    return { ...DEFAULT_STYLES, ...template.styles };
  }

  function resetError(): void {
    state.value.error = null;
  }

  return {
    state: computed(() => state.value),
    templates: computed(() => state.value.templates),
    currentTemplate: computed(() => state.value.currentTemplate),
    defaultTemplate: computed(() => state.value.defaultTemplate),
    templateNames,
    loading: computed(() => state.value.loading),
    saving: computed(() => state.value.saving),
    error: computed(() => state.value.error),
    loadTemplates,
    ensureDefaultLoaded,
    loadTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setDefaultTemplate,
    selectTemplate,
    getMergedSections,
    getMergedStyles,
    resetError,
  };
});
