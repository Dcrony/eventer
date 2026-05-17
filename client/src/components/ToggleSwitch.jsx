const ToggleSwitch = ({ checked, onChange, label, id }) => {
    return (
        <div className="inline-flex items-center gap-2">
            <label className="relative inline-block w-11 h-6">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    id={id}
                    className="opacity-0 w-0 h-0 peer"
                />
                <span className="absolute cursor-pointer inset-0 bg-gray-300 rounded-full peer-checked:bg-pink-500 peer-checked:before:translate-x-5 before:absolute before:content-[''] before:h-5 before:w-5 before:left-0.5 before:bottom-0.5 before:bg-white before:rounded-full before:transition-all before:duration-300" />
            </label>
            {label && <label htmlFor={id} className="text-sm text-gray-700 cursor-pointer">{label}</label>}
        </div>
    );
};

export default ToggleSwitch;