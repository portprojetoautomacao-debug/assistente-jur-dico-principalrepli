import {
  createMinuta as createMinutaDb,
  deleteMinuta as deleteMinutaDb,
  getAllMinutas as getAllMinutasDb,
  getMinutaById as getMinutaByIdDb,
  inicializarTabelaMinutas,
  MinutaRecord,
  updateMinuta as updateMinutaDb,
} from "../db/minutas";

export { inicializarTabelaMinutas };
export type { MinutaRecord };

export async function createMinuta(data: {
  titulo: string;
  conteudo: string;
  categoria?: string;
}): Promise<MinutaRecord> {
  const tipo = data.categoria || "outro";
  return createMinutaDb({
    titulo: data.titulo,
    conteudo: data.conteudo,
    tipo,
  });
}

export async function getMinutaById(id: string) {
  return getMinutaByIdDb(id);
}

export async function getAllMinutas() {
  return getAllMinutasDb();
}

export async function updateMinuta(id: string, data: Partial<MinutaRecord>) {
  return updateMinutaDb(id, {
    titulo: data.titulo,
    conteudo: data.conteudo,
    tipo: data.tipo,
    status: data.status,
    processId: data.processId,
    autor: data.autor,
    variaveis: data.variaveis,
    googleDocsId: data.googleDocsId,
    googleDocsUrl: data.googleDocsUrl,
    criadoPorAgente: data.criadoPorAgente,
    agenteId: data.agenteId,
    templateId: data.templateId,
    expedienteId: data.expedienteId,
  });
}

export async function deleteMinuta(id: string) {
  return deleteMinutaDb(id);
}
