import { PageHeader } from '../../components/PageHeader';
import { Workflow } from '../../components/Workflow';

export function HowItWorks() {
  return (
    <div className="pb-32">
      <PageHeader 
        title="How NEXAWIS Works" 
        subtitle="A seamless, end-to-end process from raw workforce data to sustainable project execution. We keep humans explicitly in the loop."
      />
      
      {/* 4-Step Workflow Visualizer */}
      <div className="mt-12 border-t border-[--color-border-subtle]">
        <Workflow />
      </div>

    </div>
  );
}
