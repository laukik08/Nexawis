import { PageHeader } from '../../components/PageHeader';
import { AwisGrid } from '../../components/AwisGrid';

export function NineDimensions() {
  return (
    <div className="pb-32">
      <PageHeader 
        title="The 9 Dimensions" 
        subtitle="Our proprietary framework for deconstructing and evaluating workforce talent. We look beyond basic skills to understand how humans actually work together."
      />
      
      {/* 9 Dimensions Interactive Component */}
      <div className="mt-12">
        <AwisGrid />
      </div>

    </div>
  );
}
