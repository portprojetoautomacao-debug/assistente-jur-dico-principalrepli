"""
Evaluation Framework - Assistente Jurídico PJe
===============================================

Este script avalia a performance dos agentes jurídicos usando as seguintes métricas:
1. Precisão de Análise de Intimações (Mrs. Justin-e)
2. Qualidade de Redação de Petições (redacao-peticoes)
3. Precisão de Cálculo de Prazos (gestao-prazos)

Uso:
    python scripts/evaluation/evaluate_agents.py
    python scripts/evaluation/evaluate_agents.py --output results/evaluation-report.json
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Any, Tuple
from datetime import datetime
from dataclasses import dataclass, asdict


@dataclass
class MetricResult:
    """Resultado de uma métrica individual"""
    metric_name: str
    agent_id: str
    total_queries: int
    successful_evaluations: int
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    detailed_scores: Dict[str, float]
    errors: List[str]


@dataclass
class EvaluationReport:
    """Relatório completo de avaliação"""
    timestamp: str
    total_queries: int
    metrics_evaluated: int
    overall_accuracy: float
    metric_results: List[MetricResult]
    summary: Dict[str, Any]
    recommendations: List[str]


class IntimationAnalysisEvaluator:
    """Avaliador para Precisão de Análise de Intimações"""
    
    def __init__(self):
        self.metric_name = "Precisão de Análise de Intimações"
        self.agent_id = "justine"
    
    def evaluate(self, responses: List[Dict]) -> MetricResult:
        """Avalia respostas do agente Mrs. Justin-e"""
        relevant_responses = [r for r in responses if r['metric'] == self.metric_name]
        
        total = len(relevant_responses)
        correct_tipo = 0
        correct_prazo = 0
        correct_dataLimite = 0
        correct_urgencia = 0
        correct_manifestacao = 0
        errors = []
        
        for resp in relevant_responses:
            expected = resp['expectedOutput']
            actual = resp['response'].get('output', {})
            
            # Avaliar tipo de intimação
            if expected.get('tipo') == actual.get('tipo'):
                correct_tipo += 1
            else:
                errors.append(f"{resp['queryId']}: Tipo incorreto - esperado '{expected.get('tipo')}', obtido '{actual.get('tipo')}'")
            
            # Avaliar prazo
            if expected.get('prazo') == actual.get('prazo'):
                correct_prazo += 1
            else:
                errors.append(f"{resp['queryId']}: Prazo incorreto - esperado '{expected.get('prazo')}', obtido '{actual.get('prazo')}'")
            
            # Avaliar data limite (permitir null matches)
            if expected.get('dataLimite') == actual.get('dataLimite'):
                correct_dataLimite += 1
            else:
                errors.append(f"{resp['queryId']}: Data limite incorreta - esperado '{expected.get('dataLimite')}', obtido '{actual.get('dataLimite')}'")
            
            # Avaliar urgência
            if expected.get('urgencia') == actual.get('urgencia'):
                correct_urgencia += 1
            else:
                errors.append(f"{resp['queryId']}: Urgência incorreta - esperado '{expected.get('urgencia')}', obtido '{actual.get('urgencia')}'")
            
            # Avaliar necessidade de manifestação
            if expected.get('requerManifestacao') == actual.get('requerManifestacao'):
                correct_manifestacao += 1
        
        # Calcular métricas
        accuracy_tipo = correct_tipo / total if total > 0 else 0
        accuracy_prazo = correct_prazo / total if total > 0 else 0
        accuracy_dataLimite = correct_dataLimite / total if total > 0 else 0
        accuracy_urgencia = correct_urgencia / total if total > 0 else 0
        accuracy_manifestacao = correct_manifestacao / total if total > 0 else 0
        
        overall_accuracy = (
            accuracy_tipo + accuracy_prazo + accuracy_dataLimite + 
            accuracy_urgencia + accuracy_manifestacao
        ) / 5
        
        # Precision e Recall simplificados (baseado em matches exatos)
        precision = overall_accuracy
        recall = overall_accuracy
        f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        
        return MetricResult(
            metric_name=self.metric_name,
            agent_id=self.agent_id,
            total_queries=total,
            successful_evaluations=total,
            accuracy=overall_accuracy,
            precision=precision,
            recall=recall,
            f1_score=f1,
            detailed_scores={
                'accuracy_tipo': accuracy_tipo,
                'accuracy_prazo': accuracy_prazo,
                'accuracy_dataLimite': accuracy_dataLimite,
                'accuracy_urgencia': accuracy_urgencia,
                'accuracy_manifestacao': accuracy_manifestacao,
            },
            errors=errors
        )


class PetitionQualityEvaluator:
    """Avaliador para Qualidade de Redação de Petições"""
    
    def __init__(self):
        self.metric_name = "Qualidade de Redação de Petições"
        self.agent_id = "redacao-peticoes"
    
    def evaluate(self, responses: List[Dict]) -> MetricResult:
        """Avalia respostas do agente redacao-peticoes"""
        relevant_responses = [r for r in responses if r['metric'] == self.metric_name]
        
        total = len(relevant_responses)
        scores = {
            'estrutura': 0,
            'fundamentacaoJuridica': 0,
            'citacaoLegislacao': 0,
            'jurisprudencia': 0,
            'petitosClaros': 0,
            'linguagemFormal': 0,
        }
        errors = []
        
        for resp in relevant_responses:
            expected = resp['expectedOutput']
            actual = resp['response'].get('output', {})
            
            # Avaliar estrutura (verifica se array de estrutura está presente e completo)
            expected_estrutura = expected.get('estrutura', [])
            actual_estrutura = actual.get('estrutura', [])
            if len(actual_estrutura) >= 4:  # Mínimo esperado
                scores['estrutura'] += 1
            
            # Avaliar campos booleanos
            for field in ['fundamentacaoJuridica', 'citacaoLegislacao', 'jurisprudencia', 'petitosClaros', 'linguagemFormal']:
                if expected.get(field) == actual.get(field):
                    scores[field] += 1
                else:
                    errors.append(f"{resp['queryId']}: {field} - esperado {expected.get(field)}, obtido {actual.get(field)}")
        
        # Calcular accuracy por campo
        field_accuracies = {k: v / total if total > 0 else 0 for k, v in scores.items()}
        
        # Accuracy geral
        overall_accuracy = sum(field_accuracies.values()) / len(field_accuracies) if field_accuracies else 0
        
        precision = overall_accuracy
        recall = overall_accuracy
        f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        
        return MetricResult(
            metric_name=self.metric_name,
            agent_id=self.agent_id,
            total_queries=total,
            successful_evaluations=total,
            accuracy=overall_accuracy,
            precision=precision,
            recall=recall,
            f1_score=f1,
            detailed_scores=field_accuracies,
            errors=errors
        )


class DeadlineCalculationEvaluator:
    """Avaliador para Precisão de Cálculo de Prazos"""
    
    def __init__(self):
        self.metric_name = "Precisão de Cálculo de Prazos"
        self.agent_id = "gestao-prazos"
    
    def evaluate(self, responses: List[Dict]) -> MetricResult:
        """Avalia respostas do agente gestao-prazos"""
        relevant_responses = [r for r in responses if r['metric'] == self.metric_name]
        
        total = len(relevant_responses)
        correct_dataLimite = 0
        correct_diasCorridos = 0
        correct_diasUteis = 0
        correct_feriados = 0
        correct_alertas = 0
        errors = []
        
        for resp in relevant_responses:
            expected = resp['expectedOutput']
            actual = resp['response'].get('output', {})
            
            # Data limite
            if expected.get('dataLimite') == actual.get('dataLimite'):
                correct_dataLimite += 1
            else:
                errors.append(f"{resp['queryId']}: Data limite - esperado '{expected.get('dataLimite')}', obtido '{actual.get('dataLimite')}'")
            
            # Dias corridos
            if expected.get('diasCorridos') == actual.get('diasCorridos'):
                correct_diasCorridos += 1
            
            # Dias úteis (permitir null matches)
            if expected.get('diasUteis') == actual.get('diasUteis'):
                correct_diasUteis += 1
            
            # Feriados no intervalo (comparar como arrays ou números)
            expected_feriados = expected.get('feriadosNoIntervalo', [])
            actual_feriados = actual.get('feriadosNoIntervalo', [])
            
            # Aceitar tanto array quanto número para retrocompatibilidade
            if isinstance(expected_feriados, list) and isinstance(actual_feriados, list):
                if set(expected_feriados) == set(actual_feriados):
                    correct_feriados += 1
            elif isinstance(expected_feriados, int) and isinstance(actual_feriados, list):
                if expected_feriados == len(actual_feriados):
                    correct_feriados += 1
            elif isinstance(expected_feriados, list) and isinstance(actual_feriados, int):
                if len(expected_feriados) == actual_feriados:
                    correct_feriados += 1
            else:
                if expected_feriados == actual_feriados:
                    correct_feriados += 1
            
            # Alertas (comparar listas)
            expected_alertas = set(expected.get('alertas', []))
            actual_alertas = set(actual.get('alertas', []))
            if expected_alertas == actual_alertas:
                correct_alertas += 1
            elif len(expected_alertas.intersection(actual_alertas)) > 0:
                # Crédito parcial se houver overlap
                correct_alertas += 0.5
        
        # Calcular accuracies
        accuracy_dataLimite = correct_dataLimite / total if total > 0 else 0
        accuracy_diasCorridos = correct_diasCorridos / total if total > 0 else 0
        accuracy_diasUteis = correct_diasUteis / total if total > 0 else 0
        accuracy_feriados = correct_feriados / total if total > 0 else 0
        accuracy_alertas = correct_alertas / total if total > 0 else 0
        
        overall_accuracy = (
            accuracy_dataLimite + accuracy_diasCorridos + accuracy_diasUteis + 
            accuracy_feriados + accuracy_alertas
        ) / 5
        
        precision = overall_accuracy
        recall = overall_accuracy
        f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        
        return MetricResult(
            metric_name=self.metric_name,
            agent_id=self.agent_id,
            total_queries=total,
            successful_evaluations=total,
            accuracy=overall_accuracy,
            precision=precision,
            recall=recall,
            f1_score=f1,
            detailed_scores={
                'accuracy_dataLimite': accuracy_dataLimite,
                'accuracy_diasCorridos': accuracy_diasCorridos,
                'accuracy_diasUteis': accuracy_diasUteis,
                'accuracy_feriados': accuracy_feriados,
                'accuracy_alertas': accuracy_alertas,
            },
            errors=errors
        )


class AgentEvaluationFramework:
    """Framework principal de avaliação"""
    
    def __init__(self, queries_file: str, responses_file: str):
        self.queries_file = Path(queries_file)
        self.responses_file = Path(responses_file)
        self.evaluators = [
            IntimationAnalysisEvaluator(),
            PetitionQualityEvaluator(),
            DeadlineCalculationEvaluator(),
        ]
    
    def load_data(self) -> Tuple[Dict, Dict]:
        """Carrega queries e respostas dos arquivos JSON"""
        with open(self.queries_file, 'r', encoding='utf-8') as f:
            queries = json.load(f)
        
        with open(self.responses_file, 'r', encoding='utf-8') as f:
            responses = json.load(f)
        
        return queries, responses
    
    def evaluate(self) -> EvaluationReport:
        """Executa avaliação completa"""
        print("🚀 Iniciando Avaliação de Agentes...\n")
        
        # Carregar dados
        queries, responses_data = self.load_data()
        responses = responses_data['responses']
        
        print(f"📊 Dados carregados:")
        print(f"   - Queries: {len(queries['queries'])}")
        print(f"   - Respostas: {len(responses)}\n")
        
        # Executar avaliadores
        metric_results = []
        for evaluator in self.evaluators:
            print(f"▶️  Avaliando: {evaluator.metric_name}")
            result = evaluator.evaluate(responses)
            metric_results.append(result)
            print(f"   ✅ Accuracy: {result.accuracy:.2%}")
            print(f"   📊 Precision: {result.precision:.2%} | Recall: {result.recall:.2%} | F1: {result.f1_score:.2%}\n")
        
        # Calcular métricas gerais
        overall_accuracy = sum(r.accuracy for r in metric_results) / len(metric_results)
        
        # Gerar recomendações
        recommendations = self._generate_recommendations(metric_results)
        
        # Criar relatório
        report = EvaluationReport(
            timestamp=datetime.now().isoformat(),
            total_queries=len(responses),
            metrics_evaluated=len(metric_results),
            overall_accuracy=overall_accuracy,
            metric_results=metric_results,
            summary={
                'best_performing_agent': max(metric_results, key=lambda x: x.accuracy).agent_id,
                'worst_performing_agent': min(metric_results, key=lambda x: x.accuracy).agent_id,
                'average_accuracy': overall_accuracy,
                'total_errors': sum(len(r.errors) for r in metric_results),
            },
            recommendations=recommendations
        )
        
        return report
    
    def _generate_recommendations(self, results: List[MetricResult]) -> List[str]:
        """Gera recomendações baseadas nos resultados"""
        recommendations = []
        
        for result in results:
            if result.accuracy < 0.7:
                recommendations.append(
                    f"⚠️  {result.agent_id}: Accuracy baixa ({result.accuracy:.2%}). "
                    f"Revisar lógica de {result.metric_name.lower()}."
                )
            elif result.accuracy < 0.9:
                recommendations.append(
                    f"📈 {result.agent_id}: Boa performance ({result.accuracy:.2%}), "
                    f"mas há espaço para melhoria."
                )
            else:
                recommendations.append(
                    f"✅ {result.agent_id}: Excelente performance ({result.accuracy:.2%})!"
                )
            
            # Recomendações específicas por campo
            if result.detailed_scores:
                low_scores = {k: v for k, v in result.detailed_scores.items() if v < 0.8}
                if low_scores:
                    fields = ', '.join(low_scores.keys())
                    recommendations.append(
                        f"🔍 {result.agent_id}: Focar em melhorar: {fields}"
                    )
        
        return recommendations
    
    def save_report(self, report: EvaluationReport, output_path: str):
        """Salva relatório em JSON"""
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Converter dataclasses para dict
        report_dict = {
            'timestamp': report.timestamp,
            'total_queries': report.total_queries,
            'metrics_evaluated': report.metrics_evaluated,
            'overall_accuracy': report.overall_accuracy,
            'metric_results': [
                {
                    'metric_name': r.metric_name,
                    'agent_id': r.agent_id,
                    'total_queries': r.total_queries,
                    'successful_evaluations': r.successful_evaluations,
                    'accuracy': r.accuracy,
                    'precision': r.precision,
                    'recall': r.recall,
                    'f1_score': r.f1_score,
                    'detailed_scores': r.detailed_scores,
                    'errors': r.errors[:10],  # Limitar a 10 erros por métrica
                }
                for r in report.metric_results
            ],
            'summary': report.summary,
            'recommendations': report.recommendations,
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report_dict, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Relatório salvo em: {output_file}")
    
    def print_report(self, report: EvaluationReport):
        """Imprime relatório formatado no console"""
        print("\n" + "="*70)
        print("📊 RELATÓRIO DE AVALIAÇÃO - ASSISTENTE JURÍDICO PJE")
        print("="*70)
        print(f"🕒 Timestamp: {report.timestamp}")
        print(f"📊 Total de Queries: {report.total_queries}")
        print(f"📈 Accuracy Geral: {report.overall_accuracy:.2%}")
        print(f"🏆 Melhor Agente: {report.summary['best_performing_agent']}")
        print(f"⚠️  Total de Erros: {report.summary['total_errors']}")
        
        print("\n" + "-"*70)
        print("📋 RESULTADOS POR MÉTRICA:")
        print("-"*70)
        
        for result in report.metric_results:
            print(f"\n🔹 {result.metric_name}")
            print(f"   Agente: {result.agent_id}")
            print(f"   Queries: {result.total_queries}")
            print(f"   Accuracy: {result.accuracy:.2%}")
            print(f"   Precision: {result.precision:.2%}")
            print(f"   Recall: {result.recall:.2%}")
            print(f"   F1-Score: {result.f1_score:.2%}")
            
            if result.detailed_scores:
                print(f"   Scores Detalhados:")
                for field, score in result.detailed_scores.items():
                    print(f"      - {field}: {score:.2%}")
        
        print("\n" + "-"*70)
        print("💡 RECOMENDAÇÕES:")
        print("-"*70)
        for i, rec in enumerate(report.recommendations, 1):
            print(f"{i}. {rec}")
        
        print("\n" + "="*70 + "\n")


def main():
    """Função principal"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Avaliação de Agentes Jurídicos')
    parser.add_argument(
        '--queries',
        default='data/evaluation/test-queries.json',
        help='Caminho para arquivo de queries'
    )
    parser.add_argument(
        '--responses',
        default='data/evaluation/test-responses.json',
        help='Caminho para arquivo de respostas'
    )
    parser.add_argument(
        '--output',
        default='data/evaluation/evaluation-report.json',
        help='Caminho para salvar relatório'
    )
    
    args = parser.parse_args()
    
    # Criar framework e executar avaliação
    framework = AgentEvaluationFramework(args.queries, args.responses)
    report = framework.evaluate()
    
    # Imprimir relatório
    framework.print_report(report)
    
    # Salvar relatório
    framework.save_report(report, args.output)
    
    # Exit code baseado em accuracy
    if report.overall_accuracy < 0.7:
        print("❌ Avaliação falhou: Accuracy abaixo de 70%")
        sys.exit(1)
    elif report.overall_accuracy < 0.9:
        print("⚠️  Avaliação passou com ressalvas: Accuracy entre 70-90%")
        sys.exit(0)
    else:
        print("✅ Avaliação passou: Accuracy acima de 90%")
        sys.exit(0)


if __name__ == '__main__':
    main()
