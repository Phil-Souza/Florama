// import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// export default function HomeScreen() {
//   return (
//     <View style={styles.container}>

//       {/* Cabeçalho */}
//       <View style={styles.header}>
//         <Text style={styles.logo}>🌷 Florama</Text>
//         <Text style={styles.subtitle}>
//           Flores que tornam seus momentos especiais
//         </Text>
//       </View>

//       {/* Conteúdo principal */}
//       <View style={styles.content}>

//         <Text style={styles.welcome}>Bem-vindo à</Text>

//         <Text style={styles.title}>Florama</Text>

//         <Text style={styles.description}>
//           Encontre flores lindas para presentear, decorar
//           ou simplesmente deixar seu dia mais especial. 🌸
//         </Text>

//         {/* Botão Catálogo */}
//         <TouchableOpacity
//           style={styles.catalogButton}
//           activeOpacity={0.8}
//           onPress={() => console.log('Catálogo')}
//         >
//           <Text style={styles.buttonIcon}>🌺</Text>

//           <View>
//             <Text style={styles.buttonTitle}>Catálogo</Text>
//             <Text style={styles.buttonDescription}>
//               Explore nossas flores
//             </Text>
//           </View>

//           <Text style={styles.arrow}>›</Text>
//         </TouchableOpacity>

//         {/* Botão Carrinho */}
//         <TouchableOpacity
//           style={styles.cartButton}
//           activeOpacity={0.8}
//           onPress={() => console.log('Carrinho')}
//         >
//           <Text style={styles.buttonIcon}>🛒</Text>

//           <View>
//             <Text style={styles.buttonTitle}>Carrinho</Text>
//             <Text style={styles.buttonDescription}>
//               Veja seus produtos
//             </Text>
//           </View>

//           <Text style={styles.arrow}>›</Text>
//         </TouchableOpacity>

//       </View>

//       {/* Rodapé */}
//       <View style={styles.footer}>
//         <Text style={styles.footerText}>
//           🌿 Cultivando momentos especiais
//         </Text>
//       </View>

//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FFF8F5',
//   },

//   header: {
//     paddingTop: 60,
//     paddingHorizontal: 28,
//     paddingBottom: 20,
//   },

//   logo: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#A84D68',
//   },

//   subtitle: {
//     marginTop: 6,
//     fontSize: 14,
//     color: '#8B747A',
//   },

//   content: {
//     flex: 1,
//     justifyContent: 'center',
//     paddingHorizontal: 28,
//   },

//   welcome: {
//     fontSize: 20,
//     color: '#8B747A',
//     marginBottom: 2,
//   },

//   title: {
//     fontSize: 48,
//     fontWeight: 'bold',
//     color: '#A84D68',
//     marginBottom: 15,
//   },

//   description: {
//     fontSize: 16,
//     lineHeight: 24,
//     color: '#6F5C62',
//     marginBottom: 35,
//     maxWidth: 400,
//   },

//   catalogButton: {
//     backgroundColor: '#EFA7B8',
//     borderRadius: 20,
//     padding: 18,
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 16,

//     shadowColor: '#8E4057',
//     shadowOffset: {
//       width: 0,
//       height: 5,
//     },
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//     elevation: 4,
//   },

//   cartButton: {
//     backgroundColor: '#C9DDB8',
//     borderRadius: 20,
//     padding: 18,
//     flexDirection: 'row',
//     alignItems: 'center',

//     shadowColor: '#526B42',
//     shadowOffset: {
//       width: 0,
//       height: 5,
//     },
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//     elevation: 4,
//   },

//   buttonIcon: {
//     fontSize: 30,
//     marginRight: 16,
//   },

//   buttonTitle: {
//     fontSize: 19,
//     fontWeight: 'bold',
//     color: '#4D3940',
//   },

//   buttonDescription: {
//     fontSize: 13,
//     color: '#6F5C62',
//     marginTop: 3,
//   },

//   arrow: {
//     marginLeft: 'auto',
//     fontSize: 34,
//     color: '#6B4A54',
//     fontWeight: '300',
//   },

//   footer: {
//     alignItems: 'center',
//     paddingBottom: 30,
//   },

//   footerText: {
//     fontSize: 13,
//     color: '#9A858A',
//   },
// });
import React, { useState } from "react";
import { router } from "expo-router";
import {
  DimensionValue,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

const slides = [
  ["Mais que flores, uma forma de dizer o que você sente."]
];

type LeafProps = {
  left: DimensionValue;
  top: DimensionValue;
  width: number;
  height: number;
  color: string;
  rotation: string;
};

function Leaf({ left, top, width, height, color, rotation }: LeafProps) {
  return (
    <View
      style={[
        styles.leaf,
        {
          left,
          top,
          width,
          height,
          backgroundColor: color,
          transform: [{ rotate: rotation }],
        },
      ]}
    />
  );
}

function PlantIllustration() {
  return (
    <View style={styles.art}>
      <View style={styles.backdrop} />
      <View style={styles.ground} />

      {/* Caules da planta maior */}
      <View style={[styles.stem, styles.stemTallLeft]} />
      <View style={[styles.stem, styles.stemTallRight]} />
      <View style={[styles.stem, styles.stemMiddleLeft]} />
      <View style={[styles.stem, styles.stemMiddleRight]} />

      {/* Folhas da planta maior */}
      <Leaf left="13%" top="20%" width={39} height={88} color="#245638" rotation="-38deg" />
      <Leaf left="44%" top="15%" width={38} height={92} color="#245638" rotation="28deg" />
      <Leaf left="2%" top="48%" width={36} height={76} color="#35774a" rotation="-55deg" />
      <Leaf left="43%" top="50%" width={35} height={76} color="#35774a" rotation="43deg" />
      <Leaf left="22%" top="39%" width={30} height={65} color="#4a8859" rotation="-20deg" />

      {/* Caules da planta menor */}
      <View style={[styles.stem, styles.stemSmallLeft]} />
      <View style={[styles.stem, styles.stemSmallRight]} />
      <View style={[styles.stem, styles.stemSmallMiddleLeft]} />
      <View style={[styles.stem, styles.stemSmallMiddleRight]} />

      {/* Folhas da planta menor */}
      <Leaf left="55%" top="32%" width={31} height={72} color="#36764a" rotation="-28deg" />
      <Leaf left="74%" top="34%" width={31} height={72} color="#4b8c5b" rotation="35deg" />
      <Leaf left="52%" top="57%" width={29} height={61} color="#438052" rotation="-55deg" />
      <Leaf left="75%" top="58%" width={29} height={61} color="#4b8c5b" rotation="55deg" />

      {/* Vasos */}
      <View style={styles.largePot}>
        <View style={styles.largePotRim} />
      </View>
      <View style={styles.smallPot}>
        <View style={styles.smallPotRim} />
      </View>
    </View>
  );
}

export default function Index() {
  const { height } = useWindowDimensions();
  const [step, setStep] = useState(0);
  const [started, setStarted] = useState(false);
  const screenHeight = Math.min(height - 16, 820);

  return (
    <View style={styles.page}>
      <View style={[styles.screen, { height: screenHeight }]}>
        <Text style={styles.brand}>Florama</Text>
        <Text style={styles.tagline}>Florescendo sentimentos, entregando amor</Text>

        <Text style={styles.copy}>
          {slides[step][0]}
          {"\n"}
          {slides[step][1]}
        </Text>

        <PlantIllustration />

        {/* <View style={styles.dots}>
          {slides.map((_, index) => (
            <Pressable
              key={index}
              accessibilityRole="button"
              accessibilityLabel={`Ir para etapa ${index + 1}`}
              onPress={() => {
                setStep(index);
                setStarted(false);
              }}
              style={[
                styles.dot,
                step === index && styles.activeDot,
              ]}
            />
          ))}
        </View> */}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/navegation")}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#e8ece8",
  },
  screen: {
    width: "100%",
    maxWidth: 376,
    alignItems: "center",
    overflow: "hidden",
    paddingTop: 34,
    paddingHorizontal: 22,
    paddingBottom: 30,
    borderWidth: 1,
    borderColor: "rgba(44, 62, 50, 0.11)",
    borderRadius: 27,
    backgroundColor: "#fbfcfb",
  },
  brand: {
    color: "#22342a",
    fontFamily: "Georgia",
    fontSize: 48,
    lineHeight: 54,
    letterSpacing: -2.5,
  },
  tagline: {
    marginTop: 8,
    color: "#394c40",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 2,
  },
  copy: {
    marginTop: 19,
    color: "#737a76",
    fontSize: 12,
    lineHeight: 20,
    textAlign: "center",
  },
  art: {
    position: "relative",
    width: "100%",
    maxWidth: 328,
    minHeight: 230,
    flex: 1,
    marginTop: 14,
  },
  backdrop: {
    position: "absolute",
    top: "8%",
    left: "17%",
    width: "70%",
    height: "75%",
    borderRadius: 160,
    backgroundColor: "#f1f1e8",
  },
  ground: {
    position: "absolute",
    bottom: "4%",
    left: "2%",
    width: "96%",
    height: "25%",
    borderRadius: 80,
    backgroundColor: "#f1f1e8",
  },
  stem: {
    position: "absolute",
    bottom: "18%",
    width: 2,
    backgroundColor: "#263c2d",
  },
  stemTallLeft: {
    left: "37%",
    height: "65%",
    transform: [{ rotate: "-10deg" }],
  },
  stemTallRight: {
    left: "42%",
    height: "74%",
    transform: [{ rotate: "12deg" }],
  },
  stemMiddleLeft: {
    left: "38%",
    height: "48%",
    transform: [{ rotate: "-40deg" }],
  },
  stemMiddleRight: {
    left: "43%",
    height: "45%",
    transform: [{ rotate: "37deg" }],
  },
  stemSmallLeft: {
    left: "68%",
    bottom: "12%",
    height: "43%",
    width: 1.5,
    transform: [{ rotate: "-10deg" }],
  },
  stemSmallRight: {
    left: "70%",
    bottom: "12%",
    height: "48%",
    width: 1.5,
    transform: [{ rotate: "15deg" }],
  },
  stemSmallMiddleLeft: {
    left: "69%",
    bottom: "12%",
    height: "34%",
    width: 1.5,
    transform: [{ rotate: "-40deg" }],
  },
  stemSmallMiddleRight: {
    left: "72%",
    bottom: "12%",
    height: "34%",
    width: 1.5,
    transform: [{ rotate: "38deg" }],
  },
  leaf: {
    position: "absolute",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 30,
  },
  largePot: {
    position: "absolute",
    bottom: "3%",
    left: "25%",
    width: "27%",
    height: "16%",
    borderRadius: 4,
    backgroundColor: "#d4d9cc",
  },
  largePotRim: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: 9,
    borderRadius: 12,
    backgroundColor: "#e4e7dc",
  },
  smallPot: {
    position: "absolute",
    bottom: "3%",
    left: "61%",
    width: "23%",
    height: "11%",
    borderRadius: 4,
    backgroundColor: "#285a39",
  },
  smallPotRim: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: 8,
    borderRadius: 12,
    backgroundColor: "#3a7148",
  },
  // dots: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   justifyContent: "center",
  //   gap: 13,
  //   marginTop: 22,
  //   marginBottom: 34,
  // },
  // dot: {
  //   width: 7,
  //   height: 7,
  //   borderRadius: 4,
  //   backgroundColor: "#dfe4df",
  // },
  // activeDot: {
  //   backgroundColor: "#315c3e",
  // },
  button: {
    width: "100%",
    minHeight: 49,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#21452e",
    borderRadius: 15,
    backgroundColor: "#205332",
  },
  buttonPressed: {
    backgroundColor: "#19472a",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
});