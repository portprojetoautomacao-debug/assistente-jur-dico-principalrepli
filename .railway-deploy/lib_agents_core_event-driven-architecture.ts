import { v4 as uuidv4 } from 'uuid';

// Domain Events
export interface DomainEvent {
  id: string;
  aggregateId: string;
  type: string;
  timestamp: Date;
  metadata: Record<string, any>;
  payload: any;
}

// Command and Query Segregation
export interface Command {
  id: string;
  type: string;
  payload: any;
  timestamp: Date;
}

export interface Query {
  id: string;
  type: string;
  parameters: any;
  timestamp: Date;
}

// Event Store para auditoria completa
export class EventStore {
  private events: DomainEvent[] = [];
  private snapshots: Map<string, any> = new Map();

  async append(event: DomainEvent): Promise<void> {
    this.events.push(event);
    await this.persistEvent(event);
    this.emitEvent(event);
  }

  async getEvents(aggregateId: string, fromVersion?: number): Promise<DomainEvent[]> {
    return this.events.filter(e => 
      e.aggregateId === aggregateId && 
      (!fromVersion || e.timestamp.getTime() > fromVersion)
    );
  }

  private async persistEvent(event: DomainEvent): Promise<void> {
    // Persistir em banco de dados ou queue
    await this.saveToDatabase(event);
  }

  private emitEvent(event: DomainEvent): void {
    // Publicar para outros serviços
    this.eventBus.emit(event.type, event);
  }
}

// Saga Pattern para processos complexos
export class SagaOrchestrator {
  private sagas: Map<string, Saga> = new Map();

  async startSaga(sagaType: string, initialData: any): Promise<string> {
    const sagaId = uuidv4();
    const saga = this.createSaga(sagaType, sagaId, initialData);
    
    this.sagas.set(sagaId, saga);
    await saga.start();
    
    return sagaId;
  }

  async handleEvent(event: DomainEvent): Promise<void> {
    const affectedSagas = this.findAffectedSagas(event);
    
    for (const saga of affectedSagas) {
      await saga.handle(event);
    }
  }

  private findAffectedSagas(event: DomainEvent): Saga[] {
    return Array.from(this.sagas.values())
      .filter(saga => saga.isInterestedIn(event));
  }
}