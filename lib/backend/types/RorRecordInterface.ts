interface RorRecord {
  admin: Admin;
  domains: string[];
  established: number | null;
  external_ids: ExternalId[];
  id: string;
  links: Link[];
  locations: Location[];
  names: Name[];
  relationships: Relationship[];
  status: string;
  types: string[];
}

interface Admin {
  created: AdminDate;
  last_modified: AdminDate;
}

interface AdminDate {
  date: string;
  schema_version: string;
}

interface ExternalId {
  all: string[];
  preferred: string | null;
  type: string;
}

interface Link {
  type: string;
  value: string;
}

interface Location {
  geonames_details: GeonamesDetails;
  geonames_id: number;
}

interface GeonamesDetails {
  continent_code: string;
  continent_name: string;
  country_code: string;
  country_name: string;
  country_subdivision_code: string;
  country_subdivision_name: string;
  lat: number;
  lng: number;
  name: string;
}

interface Name {
  lang: string | null;
  types: string[];
  value: string;
}

interface Relationship {
  label: string;
  type: string;
  id: string;
}
