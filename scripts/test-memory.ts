import { createProfileTools } from "../src/tools/user-profile/profile.tools";

async function main() {
  const tools = createProfileTools();
  
  const addMemoryTool = tools.find(t => t.name === 'add_user_memory');
  const getProfileTool = tools.find(t => t.name === 'get_user_profile');
  const updateProfileTool = tools.find(t => t.name === 'update_profile_field');

  if (!addMemoryTool || !getProfileTool || !updateProfileTool) {
    console.error("Tools not found!");
    return;
  }

  console.log("--- Testing Add Memory ---");
  console.log(await addMemoryTool.invoke({ memory: "User is testing the memory feature." }));

  console.log("--- Testing Update Profile ---");
  console.log(await updateProfileTool.invoke({ key: "name", value: "Test User" }));

  console.log("--- Testing Get Profile ---");
  console.log(await getProfileTool.invoke({}));
}

main().catch(console.error);
