// Moved to src/api/endorsements; re-exported until every caller migrates (docs/query/PLAN.md)
export {
  createEndorsement,
  ENDORSEMENT_SELECT,
  fetchEndorsements,
  updateEndorsement,
} from "../../api/endorsements/endorsements.service";
export type { EndorsementFilter } from "../../api/endorsements/endorsements.types";
