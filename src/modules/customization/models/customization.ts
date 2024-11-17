import { model } from "@medusajs/framework/utils";

const Customization = model.define("customization",{
  id:model.id().primaryKey(),
  theme:model.text(),
  styles:model.json()
})

export default Customization;
