export type Availability = 'available' | 'limited' | 'unavailable';

export type InquiryStatus = 'new' | 'in_review' | 'quoted' | 'closed' | 'archived';

export type CustomizationFieldType = 'text' | 'textarea' | 'select';

export type CatalogMedia = {
  url: string;
  altText: string;
  caption: string | null;
  sortOrder: number;
  isFeatured: boolean;
};

export type CustomizationField = {
  key: string;
  label: string;
  type: CustomizationFieldType;
  required: boolean;
  options: string[];
  helpText: string | null;
  sortOrder: number;
};

export type CatalogLine = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  sortOrder: number;
};

export type CatalogProduct = {
  id: string;
  lineSlug: string;
  slug: string;
  name: string;
  description: string | null;
  materials: string[];
  availability: Availability;
  media: CatalogMedia[];
  customizationFields: CustomizationField[];
};
