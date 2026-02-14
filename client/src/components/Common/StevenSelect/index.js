import { FormControl, MenuItem, Select } from "@mui/material";

const StevenSelect = ({ value, onChange, options, fullWidth = true, sx = {}, ...props }) => {
  return (
    <FormControl fullWidth={fullWidth} sx={sx}>
      <Select value={value} onChange={onChange} {...props}>
        {options.map((option) => (
          <MenuItem key={String(option.value)} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default StevenSelect;
