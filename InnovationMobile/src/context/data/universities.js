// Seed list of Tanzanian (and surrounding region) universities for the
// Club Registration flow. Keep the shape flat — { id, name, shortName }
// — so the picker component doesn't have to special-case anything.
//
// Why a plain .js file: no JSX, no React. Just data.
// In production, this would be fetched from a /universities endpoint.

export const universities = [
  { id: 'u1', name: 'University of Dar es Salaam', shortName: 'UDSM' },
  { id: 'u2', name: 'Muhimbili University of Health and Allied Sciences', shortName: 'MUHAS' },
  { id: 'u3', name: 'Ardhi University', shortName: 'ARU' },
  { id: 'u4', name: 'University of Dodoma', shortName: 'UDOM' },
  { id: 'u5', name: 'Sokoine University of Agriculture', shortName: 'SUA' },
  { id: 'u6', name: 'Nelson Mandela African Institution of Science and Technology', shortName: 'NM-AIST' },
  { id: 'u7', name: 'Open University of Tanzania', shortName: 'OUT' },
  { id: 'u8', name: 'Mzuzu University', shortName: 'MZUNI' },
  { id: 'u9', name: 'University of Cape Town', shortName: 'UCT' },
  { id: 'u10', name: 'Makerere University', shortName: 'MAK' },
];
