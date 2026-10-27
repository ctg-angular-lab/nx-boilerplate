import { IProcedureLaboratory } from '@nx-boilerplate/api-interfaces';

export interface ProcedureSummaryData {
  nombreProcedimiento: string;
  valorStandar: number;
  duracionStandar: number;
  laboratorios?: IProcedureLaboratory[];
}
