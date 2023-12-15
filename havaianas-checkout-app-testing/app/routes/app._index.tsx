import { useState , useCallback} from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useActionData, useNavigation, useSubmit } from "@remix-run/react";
import { Page, TextField, Button } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
//   const { admin } = await authenticate.admin(request);
//   const createdFile = await admin.graphql(
//     `#graphql
//   mutation {fileCreate(files: [{alt:"Garys logo",filename:"favicon-image", originalSource:"https://img.icons8.com/?size=256&id=53372&format=png"}]) {
  
//     files {
//       id
//       alt
//       createdAt
//     }
//   }
// }
// `,
//   );

//   let createdFileParsed = await createdFile.json();
//   let faviconId = createdFileParsed.data.fileCreate.files[0].id;
//   console.log(createdFileParsed.data.fileCreate.files[0].id);

  // const response = await admin.graphql(
  //   `#graphql
  //   query checkoutProfiles {
  //     checkoutProfiles(first: 10) {
  //       nodes {
  //         id
  //         isPublished
  //       }
  //     }
  //   }`,
  // );
  // const data = await response.json();
  // const firstNodeId = data.data.checkoutProfiles.nodes[0].id;
  // console.log(data.data.checkoutProfiles.nodes[0].id);

  // const insertFaviconResponse = await admin.graphql(
  //   `#graphql
  //     mutation {
  //       checkoutBrandingUpsert(
  //         checkoutBrandingInput: {
  //           customizations: {
  //             header: {
  //               logo: {
  //                 image: {
  //                   mediaImageId: "${faviconId}"
  //                 }
  //               }
  //             }
  //           }
  //         },
  //         checkoutProfileId: "${firstNodeId}"
  //       ) {
  //         userErrors {
  //           field
  //           message
  //         }
  //       }
  //     }
  //   `
  // );

  // const insertFaviconData = await insertFaviconResponse.json();
  // console.log(insertFaviconData);
  let randomReturn = "randomreturn"
  return json(randomReturn);
};

export async function action({ request }) {
  const { admin } = await authenticate.admin(request);

  let formData = await request.formData();
  let faviconURL = formData.get("faviconValue")
  let fileName = formData.get("fileName")
  const createdFile = await admin.graphql(
    `#graphql
  mutation {fileCreate(files: [{alt:"Garys logo",filename:"${fileName}", originalSource:"${faviconURL}"}]) {
    files {
      id
      alt
      createdAt
    }
    userErrors {
      field
      message
    }
  }
}
`,
  );

  let createdFileParsed = await createdFile.json();
  console.log(createdFileParsed,createdFileParsed.data.fileCreate.files, createdFileParsed.data.fileCreate.userErrors, 'hi');

  let faviconId = createdFileParsed.data.fileCreate.files[0].id
  console.log(faviconId, 'favicon id')

    const response = await admin.graphql(
    `#graphql
    query checkoutProfiles {
      checkoutProfiles(first: 10) {
        nodes {
          id
          isPublished
        }
      }
    }`,
  );
  const data = await response.json();
  const firstNodeId = data.data.checkoutProfiles.nodes[0].id;
  console.log(data.data.checkoutProfiles.nodes[0].id);
  console.log(firstNodeId, 'first node id')

  const insertFaviconResponse = await admin.graphql(
    `#graphql
      mutation {
        checkoutBrandingUpsert(checkoutProfileId: ${firstNodeId}){
          "checkoutBrandingInput": {
            "customizations": {
              "favicon": {
                "mediaImageId": "${faviconId}"
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }   
    `);

  const insertFaviconData = await insertFaviconResponse.json();
  console.log(insertFaviconData.data.checkoutBrandingUpsert.userErrors, 'last console log');

  return(json({message: "Image sync commencing. Please wait for success message",
  success: true, }))
}

export default function Index() {

  const [faviconValue, setFavicon] = useState("");
  const [fileName,setFileName] = useState("");

  const submit = useSubmit();
  
  const handleChange = useCallback(
    (newFaviconValue: string) => { setFavicon(newFaviconValue)
    let fileType = newFaviconValue.match(/\.[^.]*$/)
    setFileName(`Favicon${fileType}`);  
    },
    [],
  );

  const submitFavicon = ()=> 
  submit({ faviconValue, fileName }, { replace: true, method: "POST" });
  

  return (
      <Page>
        Havaianas Checkout App
        <TextField label="Favicon URL" value={faviconValue} onChange ={handleChange}/>
        <Button onClick={submitFavicon}>Add Favicon to Checkout</Button>
      </Page>
  );
}
