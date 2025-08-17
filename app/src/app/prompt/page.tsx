import { BorderBeam } from "@/components/magicui/border-beam";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Prompt() {
  return (
    <div className="min-h-screen">
      <div className="flex md:flex-row flex-col !gap-10 !mt-30 !ml-10 !mr-10">
        <Card className=" w-full bg-foreground text-background !p-5 relative ">
          <CardHeader>
            <CardTitle>Model Select</CardTitle>
            <CardDescription>
              Every time you select a new LLM you might have to download and
              cache it, which takes time depending on your connection.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select>
              <SelectTrigger className="w-[180px] indent-2">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 indent-2 text-accent">
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>

          <BorderBeam duration={8} size={100} />
        </Card>
        <Card className="w-full bg-foreground text-background !p-5 relative ">
          <CardHeader>
            <CardTitle>Mode Select</CardTitle>
            <CardDescription>
              Choose between typical chatbot style where you and the LLM use the
              same input space to communicate, separated prompt and response
              which is useful when trying to automate the editing from a batch
              job, and separated prompt and response with a before and after
              comparison.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select>
              <SelectTrigger className="w-[180px] indent-2">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 indent-2 text-accent">
                <SelectItem value="light">Standard</SelectItem>
                <SelectItem value="dark">Separated</SelectItem>
                <SelectItem value="system">
                  Separated with comparison
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>

          <BorderBeam duration={8} delay={4} size={100} />
        </Card>
      </div>
    </div>
  );
}
