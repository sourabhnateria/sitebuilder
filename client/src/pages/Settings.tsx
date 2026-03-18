import {
  AccountSettingsCards,
  ChangePasswordCard,
  DeleteAccountCard,
} from "@daveyplate/better-auth-ui";

const Settings = () => {
  return (
    <div className="w-full p-4 flex justify-center items-center min-h-[90vh] flex-col gap-6 py-12">
      <AccountSettingsCards
        classNames={{
          card: {
            base: "bg-black/10 ring ring-indigo-450 max-w-xl mx-auto ",
            description: "text-black/60",
            content: "text-black",
            footer: "bg-black/10 text-black ring ring-indigo-450",
          },
        }}
      />
      <div className="w-full">
        <ChangePasswordCard
          classNames={{
            base: "bg-black/10 ring ring-indigo-450 max-w-xl mx-auto ",
            description: "text-black/60",
            content: "text-black",
            footer: "bg-black/10 text-black ring ring-indigo-450",
          }}
        />
      </div>
      <div className="w-full">
        <DeleteAccountCard
          classNames={{
            base: "bg-black/10 ring ring-indigo-450 max-w-xl mx-auto ",
            description: "text-black/60",
            content: "text-black",
            footer: "bg-black/10 text-black ring ring-indigo-450",
          }}
        />
      </div>
    </div>
  );
};

export default Settings;
