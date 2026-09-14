import React from 'react';

interface LiquidSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void | Promise<void>;
    disabled?: boolean;
}

const LiquidSwitch: React.FC<LiquidSwitchProps> = ({ checked, onChange, disabled = false }) => {
    const handleClick = () => {
        if (!disabled) {
            onChange(!checked);
        }
    };

    return (
        <>
            <label
                className={`liquid-switch ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={(e) => {
                    e.preventDefault();
                    handleClick();
                }}
            >
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => { }} // Controlled by label click
                    disabled={disabled}
                />
                <div className="liquid-switch-slider"></div>
                <div className={`liquid-switch-dot ${checked ? 'liquid-switch-dot-on' : 'liquid-switch-dot-off'}`}>
                    <div className={`liquid-switch-dot-filter ${checked ? 'liquid-filter-on' : 'liquid-filter-off'}`}></div>
                    <div className="liquid-switch-dot-overlay"></div>
                    <div className={`liquid-switch-dot-specular ${checked ? 'liquid-specular-on' : 'liquid-specular-off'}`}></div>
                </div>
            </label>
        </>
    );
};

export default LiquidSwitch;
