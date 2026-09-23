import { PageHeader } from '../../components/PageHeader';
import { AiEngines } from '../../components/AiEngines';

export function ProjectIntelligence() {
  return (
    <div className="pb-32">
      <PageHeader 
        title="Project Intelligence" 
        subtitle="Stop viewing projects as just tasks and deadlines. Deconstruct them into precise behavioral and technical vectors."
        badge="Solutions"
      />
      
      {/* Visual Component Reused */}
      <div className="mt-12">
        <AiEngines />
      </div>

    </div>
  );
}
