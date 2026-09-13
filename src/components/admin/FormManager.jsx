import { Sliders } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import FormBuilder from './FormBuilder';

export default function FormManager() {
    const { centerName } = useAdmin();

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-8">
            <div className="max-w-[900px] mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                        <Sliders className="text-[#463a7a]" /> Form
                    </h1>
                    <p className="text-slate-400 font-bold text-sm mt-1">
                        Edit the admission form for {centerName || 'your center'}. Changes only affect this center's form.
                    </p>
                </div>

                <FormBuilder centerName={centerName} />
            </div>
        </div>
    );
}
