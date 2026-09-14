
import React from 'react';
import { Download, Upload, Archive } from 'lucide-react';
import { SectionTitle, MenuItem } from './shared';

interface DataSectionProps {
    onExport: () => void;
    onImport: () => void;
    onOpenArchive: () => void;
    isPro: boolean;
    justUnlocked: boolean;
    user: any;
    language: 'ru' | 'en';
    t: any;
}

const DataSection: React.FC<DataSectionProps> = ({
    onExport, onImport, onOpenArchive, isPro, justUnlocked,
    user, language, t
}) => (
    <>
        <SectionTitle>{t.data}</SectionTitle>
        <div className="flex flex-col rounded-2xl overflow-hidden">
            <MenuItem icon={Download} label={t.export} onClick={onExport} locked={(!isPro && !justUnlocked)} subLabel={(!isPro && !justUnlocked) ? t.onlyPro : ''} />
            <MenuItem icon={Upload} label={t.import} onClick={onImport} locked={(!isPro && !justUnlocked)} subLabel={(!isPro && !justUnlocked) ? t.onlyPro : ''} />
        </div>

        <SectionTitle>{t.appSection}</SectionTitle>
        <div className="flex flex-col rounded-2xl overflow-hidden">
            <MenuItem icon={Archive} label={t.archive} onClick={onOpenArchive} />
        </div>
    </>
);

export default DataSection;
